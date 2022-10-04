const express = require('express');
const axios = require('axios');
const { 
    getToken,
    contaLuzCreateUser,
    contaLuzGetUserIdByPhone,
    contaLuzSendWhatsappMessage,
    contaLuzSendWhatsappFlow,
    sendUserInfoMessage,
} = require('../../functions/contaLuz');

const router = express.Router();
const apiCredentials = {};

router.get('/', (req, res) => {
    return res.json({ message: 'conta luz router ok!' });
})

router.post('/user/create', async(req, res) => {
    const { firstName, lastName, phone } = req.body;

    await contaLuzCreateUser({ first_name: firstName, last_name: lastName , phone });

    const id = await contaLuzGetUserIdByPhone({ userPhone: phone });

    const messageSend = await contaLuzSendWhatsappMessage({ userID: id });

    if(messageSend) {
        return res.json({ message: 'message sent'});
    }

    res.status(401);
    return res.json({ message: 'unable to send message' });
})

router.post('/user/create-v2', async(req, res) => {
    const { firstName, lastName, phone, userMessageObj } = req.body;

    await contaLuzCreateUser({ first_name: firstName, last_name: lastName , phone });

    const id = await contaLuzGetUserIdByPhone({ userPhone: phone });

    const messageSend = await sendUserInfoMessage({ userID: id , messageObj: userMessageObj });

    await contaLuzSendWhatsappFlow({ userID: id });

    if(messageSend) {
        return res.json({ message: 'message sent'});
    }

    res.status(401);
    return res.json({ message: 'unable to send message' });
})

router.get('/token', async (req, res) => {
    try {
        await getToken(apiCredentials);
        return res.json(apiCredentials)
    } catch (error) {
        console.log(error);    
        return res.json({ message: 'Unable to Login' });
    }
})

router.post('/citie-available', async (req, res) => {
    const { citieID } = req.body;
   
    if(!apiCredentials?.token) {
        await getToken(apiCredentials);
    }

    const currentDay = new Date()
    const expiresDay = new Date(apiCredentials.expires)

    if(currentDay >= expiresDay) await getToken(apiCredentials);

    try {
        const { data } = await axios.get(`${process.env.CREFAZ_BASE_URL}/api/proposta/produtos-regiao/${citieID}`, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });

        return res.json(data);

    } catch (error) {
        console.log(error.message);
        return res.json({ message: 'Error' });
    }
})

router.post('/create-proposal', async (req, res) => {
    const userData = req.body;
   
    if(!apiCredentials?.token) await getToken(apiCredentials);

    const currentDay = new Date()
    const expiresDay = new Date(apiCredentials.expires)

    if(currentDay >= expiresDay) await getToken(apiCredentials);

    try {
        const { data } = await axios.post(`${process.env.CREFAZ_BASE_URL}/api/proposta`, userData, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });

        console.log(data);

        return res.json(data);

    } catch (error) {
        console.log(error.message);
        console.log(error);
        return res.json({ message: 'Error' });
    }
})

module.exports = router;