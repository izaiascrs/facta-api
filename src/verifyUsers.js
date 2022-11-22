const cron = require('node-cron');
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

const { getToken, contaLuzCreateUser, contaLuzGetUserIdByPhone, CONTA_LUZ_HEADERS } = require('./functions/contaLuz');
const cities = require('../cities.json');
const creds = require('./config/cred.json');

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const PHONE = process.env.NOTIFY_PHONE;

const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

const cronConfig = {
    scheduled: true,
    timezone: "America/Sao_Paulo"
}

let index = 0;

const apiCredentials = {};
let usersData = [];
const approvedUsers = [];
const invalidUsers = [];
let usersChecked = {};

const states = {
    Acre: "AC",
    Alagoas: "AL",
    'Amapá': "AP",
    Amazonas: "AM",
    Bahia: "BA",
    "Ceará": "CE",
    "Distrito Federal": "DF",
    "Espírito Santo": "ES",
    "Goiás": "GO",
    "Maranhão": "MA",
    "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG",
    "Pará": "PA",
    "Paraíba": "PB",
    "Paraná":"PR",
    "Pernambuco":"PE",
    "Piauí":"PI",
    "Rio de Janeiro":"RJ",
    "Rio Grande do Norte":"RN",
    "Rio Grande do Sul":"RS",
    "Rondônia":"RO",
    "Roraima":"RR",
    "Santa Catarina":"SC",
    "São Paulo":"SP",
    "Sergipe":"SE",
    "Tocantins":"TO",
}

const ocupations = {
    Assalariado:  1,
    "Funcionário Público": 2,
    Aposentado : 3,
    Pensionista: 4,
    "Autônomo / Sem Vínculo Empregatício": 5,
    "Profissional Liberal": 6,
    "Empresário / Proprietário": 7,
    "Outros": 8,
};

async function loadUsers () {
    try {
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo(); // loads document properties and worksheets
        const docData = await doc.sheetsByIndex[0]; // loads document properties and worksheets
        const rows = await docData.getRows();

        rows?.forEach((row) => {
                const [ day, month, year ] = row['data-de-nascimento'].split('/');

                if(!usersChecked[row.nome]) {
                    usersData.push({
                        cpf: row?.cpf?.padEnd(11,0).replace(/\D/g, ''),
                        nome: row.nome,
                        data_nascimento: `${year}-${month?.padStart(2, 0)}-${day?.padStart(2, 0)}`,
                        telefone: row.whatsapp,
                        cidade: row.cidade,
                        uf: row.estado,
                        ocupacaoId: ocupations[row['classificação']],
                        codCidadeIBGE: cities[states[row.estado]].find((citie) => citie.nome == row.cidade).id 
                    });
                }
                usersChecked[row.nome] = true;
        });

        if(usersData.length >= 200) {
            console.log('set max users 200');
            usersData = usersData.slice(0, 200);
        }
        
    } catch (error) {
        console.log(error.message);
        await sendMessage('erro ao carregar tabela de clientes!');
    }
}

async function saveApprovedUsersToGoogleSheets(userArray) {
    const sheet = await doc.sheetsByTitle["Aprovados"];
    await sheet.addRows(userArray);
}

async function saveInvalidUsersToGoogleSheets(userArray) {
    const sheet = await doc.sheetsByTitle["Reprovados"];
    await sheet.addRows(userArray);
}

function sanatizeUser(user) {
    return {
        "cpf": user.cpf,
        "nome": user.nome,
        "data_nascimento": user['data_nascimento'],
        "telefone": user.telefone,
        "ocupacaoId": 2,
        "codCidadeIBGE": 5200258,
    }
}

async function * createProposal() {
    if(!apiCredentials?.token) await getToken(apiCredentials);

    const currentDay = new Date();
    const expiresDay = new Date(apiCredentials.expires);

    if(currentDay >= expiresDay) await getToken(apiCredentials);

    for (const user of usersData) {
        const dataNeded = sanatizeUser(user);
        await sleep(3000)
        console.log('user', ++index);
        try {
            const { data: { data } } = await axios.post(`${process.env.CREFAZ_BASE_URL}/api/proposta`, dataNeded, {
                headers: {
                    'Authorization': `Bearer ${apiCredentials?.token}`
                }
            });

            yield [ user, { data }];
        
        } catch (error) {
            console.log(error.message);
            invalidUsers.push(user);
        }
    }

    index = 0;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(message) {
    console.log('sending message');
    await contaLuzCreateUser({ first_name: 'emerson', last_name: 'silva', phone: PHONE });
    const userID = await contaLuzGetUserIdByPhone({ userPhone: PHONE });
   
    const messageData = {
        "type": "text",
        "value": message,
    }
    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_message/`, messageData, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        console.log(error);
        return false;
    }
}

cron.schedule('0 10 * * *', async () => {
    let day = new Date().toLocaleDateString('pt-br', { weekday: 'long' });
    console.log('runing', new Date().toString());
    if(day === "sábado" || day === 'domingo') return;

    await loadUsers();
    if(!usersData.length) return;
    
    await sendMessage('iniciando pré-analise dos clientes.');

    for await (const data of createProposal()) {
        console.log('status', data[1]?.data?.aprovado);  
        if(data[1]?.data?.aprovado) {
            approvedUsers.push(info.value[0]);
        }
    }

    await sendMessage(`pré-analise dos clientes finalizada,\n *${usersData.length}* clientes analizados, *${approvedUsers.length}* novos clientes aprovados e *${invalidUsers.length}* com dados incorretos.`);
    
    if(approvedUsers.length) await saveApprovedUsersToGoogleSheets(approvedUsers);
    if(invalidUsers.length) await saveInvalidUsersToGoogleSheets(invalidUsers);
    
    approvedUsers.length = 0;
    invalidUsers.length = 0;
    usersChecked = {}

    console.log('finished');

}, cronConfig);
