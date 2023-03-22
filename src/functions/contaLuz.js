const axios = require('axios');
require('dotenv').config();

const CONTA_LUZ_HEADERS = { headers: { 'API-KEY': process.env.WHATSAPP_KEY } };

async function getToken(apiCredentials) {
    const userCredentials = {
        login: process.env.CONTA_LUZ_USER,
        senha: process.env.CONTA_LUZ_PASSWORD,
        apiKey: process.env.CONTA_LUZ_KEY
    }

    try {
        const { data } = await axios.post(`${process.env.CREFAZ_BASE_URL}/api/usuario/login`, userCredentials);
        const expiresDay = data.data.expires.split('T')[0];
        apiCredentials.token = data.data.token;
        apiCredentials.expires = expiresDay.replace(/-/g, '/');
        
        return apiCredentials;

    } catch (error) {
        console.log(error);
        return false;
    }
}

async function contaLuzCreateUser ({ phone, first_name, last_name }) {
    const userInfo = { phone, first_name, last_name };

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/`, userInfo, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);        
        return false;
    }
}

async function contaLuzGetUserIdByPhone({ userPhone = '' }) {
    try {
        const { data } = await axios.get(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userPhone}`, CONTA_LUZ_HEADERS); 
        return data.id;
    } catch (error) {
        console.log(error.message);
    }
}

async function contaLuzSendWhatsappMessage({ userID = ''}) {
    console.log({ userID });
    const flowInfo = { flow: 446029 };
    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_flow/`, flowInfo, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

async function contaLuzSendWhatsappFlow({ userID = ''}) {
    const flowInfo = { flow: 585650 };
    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_flow/`, flowInfo, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

async function sendUserInfoMessage({ messageObj = {} , userID = '', valueAvailable = 0 }) {
    let message = 'Olá, obrigado por realizar a simulação no nosso site!';
    if(valueAvailable > 0) message+= `\n*Valor pré-aprovado*: ${formatNumberAsCurrency(valueAvailable)}`;    
    message += '\n*Seus Dados Cadastrados*\n';
   
    for (key in messageObj) {
        message += `*${key}*` + ": " + messageObj[key] + "\n";
    }
    message += "\nConfira seus dados para evitar erros na simulação.\nHavendo informações incorretas, por gentileza nos informe antes de finalizarmos a simulação. \nImportante: *informações inconsistentes irão cancelar a simulação*." 

    const messageData = {
        "type": "text",
        "value": message,
    }

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_message/`, messageData, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

async function sendProposalIDAndLinkMessage({ proposalID = 0 , userID = '', name = '', page = '' }) {
    const BASE_URL = page || 'https://www.isocredconfiance.com.br/emprestimo-na-conta-de-energia';
    let message = `Olá ${name}, esse é ID da sua simulação *${proposalID}*, `;
        message += `utilize seu ID para acompanhar o andamento da sua simulação acessando o link abaixo 👇👇 \n ${BASE_URL}?id=${proposalID}#search`;
    
    const messageData = {
        "type": "text",
        "value": message,
    }

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_message/`, messageData, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

function formatNumberAsCurrency(n) {
    return Number(n).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
}

function normalizeData(userInfoObj) {
    return {
        "cpf": userInfoObj.cpf,
        "nome": userInfoObj.nome,
        "nascimento": userInfoObj.nascimento,
        "telefone": userInfoObj.telefone,
        "ocupacaoId": userInfoObj.ocupacaoId,
        "cidadeId": userInfoObj.citieID,
        // "bairro": userInfoObj.bairro,
        // "logradouro": userInfoObj.logradouro,
        "cep":userInfoObj.cep,
        "urlNotificacaoParceiro": "https://smartwatchtec.com.br/api/conta-luz/acompanhamento",
    }
}

module.exports = {
    contaLuzCreateUser,
    contaLuzGetUserIdByPhone,
    contaLuzSendWhatsappMessage,
    getToken,
    sendUserInfoMessage,
    contaLuzSendWhatsappFlow,
    CONTA_LUZ_HEADERS,
    normalizeData,
    sendProposalIDAndLinkMessage    
};