const axios = require('axios');

const CONTA_LUZ_HEADERS = { headers: { 'API-KEY': process.env.CONTA_LUZ_KEY } };

async function contaLuzCreateUser ({ phone, first_name, last_name }) {
    const userInfo = { phone, first_name, last_name };

    try {
        await axios.post(`${process.env.CONTA_LUZ_BASE_URL}/subscriber/`, userInfo, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error.message);        
        return false;
    }
}

async function contaLuzGetUserIdByPhone({ userPhone = '' }) {
    console.log(userPhone);
    try {
        const { data } = await axios.get(`${process.env.CONTA_LUZ_BASE_URL}/subscriber/${userPhone}`, CONTA_LUZ_HEADERS); 
        return data.id;
    } catch (error) {
        console.log(error.message);
    }
}

async function contaLuzSendWhatsappMessage({ userID = ''}) {
    console.log({ userID });
    const flowInfo = { flow: 446029 };
    try {
        await axios.post(`${process.env.CONTA_LUZ_BASE_URL}/subscriber/${userID}/send_flow/`, flowInfo, CONTA_LUZ_HEADERS);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}


module.exports = { contaLuzCreateUser, contaLuzGetUserIdByPhone, contaLuzSendWhatsappMessage };