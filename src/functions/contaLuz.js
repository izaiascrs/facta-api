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
    console.log(userPhone);
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

async function sendUserInfoMessage({ messageObj = {} , userID = ''}) {
    let message = 'Olá, obrigado por realizar a simulação no nosso site! \n\n*Seus Dados Cadastrados:*\n'
   
    for (key in messageObj) {
        message += `*${key}*` + ": " + messageObj[key] + "\n";
    }
    message += '\n*Caso algum dado esteja errado por favor corrija!*' 

    const messageData = {
        "type": "text",
        "value": message,
    }


    console.log(messageData, userID);

    try {
        await axios.post(`${process.env.WHATSAPP_BASE_URL}/subscriber/${userID}/send_message/`, messageData, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}


module.exports = { contaLuzCreateUser, contaLuzGetUserIdByPhone, contaLuzSendWhatsappMessage, getToken, sendUserInfoMessage, contaLuzSendWhatsappFlow };