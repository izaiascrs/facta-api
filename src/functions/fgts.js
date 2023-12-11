const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const { BOT, CONTRATO_LINK, NOTIFICAR_ALINE, SIMULACAO} = require('../constants/fgts')

const FGTS_HEADERS = { headers: { 'API-KEY': process.env.WHATSAPP_KEY } };

const FGTS_WEBHOOK_LINK = process.env.FGTS_WEBHOOK_LINK;
const FGTS_NOTIFY_ALINE_WEBHOOK_LINK = process.env.FGTS_NOTIFY_ALINE_WEBHOOK_LINK;
const NOTIFY_PHONE = process.env.NOTIFY_PHONE;

async function getToken(apiCredentials) {
    try {
        const { data } = await axios.get(`${process.env.FACTA_BASE_URL}/gera-token`, {
            headers: {
                'Authorization': process.env.FGTS_AUTHORIZATION
            }
        });

        const day = data.expira.split(' ')[0];
        apiCredentials.token = data.token;
        apiCredentials.expires = data.expira.split(' ')[1];
        apiCredentials.day = day.split('/').reverse().join('/')

        return apiCredentials;

    } catch (error) {
        console.log(error);
        return false;
    }
}

async function sendWhatsAppLink({ codigo_af= '', apiCredentials }) {
    const bodyData = { codigo_af, tipo_envio: 'whatsapp' };
    const formData = new FormData();
    const headers = { headers: { 'Authorization': `Bearer ${apiCredentials?.token}` }};
    Object.entries(bodyData).forEach(([key, value]) => formData.append(key, value));

    const mockData = {
        "erro": false,
        "codigo_af": 53662881,
        "mensagem": "whatsapp enviado com sucesso.",
        "url_formalizacao": "facta.ly/4e956e08"
    }

    console.log(mockData);

    return mockData;

    // try {
    //     const { data } = await axios.post(`${process.env.FACTA_BASE_URL}/proposta/envio-link`, formData, headers);
    //     console.log(data);
    //     return res.json(data);
    // } catch (error) {
    //     console.log(error);
    //     return res.json({ message: 'não foi possivel concluir a operação'})
    // }

}

async function whatsappCreateUser ({ phone, first_name, last_name }) {
    const userInfo = { phone, first_name, last_name };

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/`, userInfo, FGTS_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);        
        return false;
    }
}

async function whatsappGetUserIdByPhone({ userPhone = '' }) {
    console.log(userPhone);
    try {
        const { data } = await axios.get(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userPhone}`, FGTS_HEADERS); 
        return data.id;
    } catch (error) {
        console.log(error.message);
    }
}

async function fgtsSendFluxo({ userID = ''}) {
    const flowInfo = { flow: 545495 };
    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_flow/`, flowInfo, FGTS_HEADERS);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fgtsSendSimulationMsg({ telefone = ''  }) {
    try {
        await axios.post(FGTS_WEBHOOK_LINK, { telefone, tipo_fluxo: SIMULACAO });
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fgtsSendContractLinkMsg({ contractLink = '', nome = '', telefone = '' }) {
    const msgData = {
        contrato_link: contractLink,
        nome: nome,
        telefone: telefone,
        tipo_fluxo: CONTRATO_LINK,
    }

    try {
        await axios.post(FGTS_WEBHOOK_LINK, msgData);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fgtsSendBotSimulationMsg({ nome, telefone }) {
    const msgData = {        
        nome: nome,
        telefone: telefone,
        tipo_fluxo: BOT,
    }

    try {
        await axios.post(FGTS_WEBHOOK_LINK, msgData);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fgtsNotifyAline({ status, nome }) {
    let message = '';

    if(status === 'done') {
        message += `O cliente ${nome} concluiu a contratação do saque aniversário do facta!`;
    } else {
        message += `O cliente ${nome} desistiu da contratação do saque aniversário do facta!`;
    }

    const msgData = { tipo_fluxo: NOTIFICAR_ALINE, mensagem: message, telefone: NOTIFY_PHONE, };

    try {
        await axios.post(FGTS_NOTIFY_ALINE_WEBHOOK_LINK, msgData);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fgtsSendBotFluxo({ userID = '', flowID }) {
    const flowInfo = { flow: flowID || 2253576 };
    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_flow/`, flowInfo, FGTS_HEADERS);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fgtsSendWhatsappMessage({ userID = '', contractLink = '' }) {
    
    const message = { "type": "text", "value": contractLink };

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_message/`, message, FGTS_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

async function notifyFgtsStatus({ userID = '', status = 'done', name = '' }) {
    // const userIDPhone = 22826894;
    let message = '';
    if(status === 'done') {
        message += `O cliente ${name} concluiu a contratação do saque aniversário do facta!`;
    } else {
        message += `O cliente ${name} desistiu da contratação do saque aniversário do facta!`;
    }

    const messageData = {
        "type": "text",
        "value": message,
    }

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_message/`, messageData, FGTS_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }

}


module.exports = { 
    getToken,
    sendWhatsAppLink,
    fgtsSendFluxo,
    fgtsSendWhatsappMessage,
    whatsappCreateUser,
    whatsappGetUserIdByPhone,
    notifyFgtsStatus,
    fgtsSendBotFluxo,
    fgtsSendSimulationMsg,
    fgtsSendContractLinkMsg,
    fgtsSendBotSimulationMsg,
    fgtsNotifyAline
};
