const express = require('express');
const { getToken } = require('../../functions/fgts'); 
const axios = require('axios');

const router = express.Router();

const apiCredentials = {}

router.get('/', (req, res) => {
    return res.json({ message: 'fgts router ok!' });
})

router.get('/token', async (req, res) => {
    try {
        const { data } = await axios.get(`${process.env.FACTA_BASE_URL}/gera-token`, {
            headers: {
                'Authorization': process.env.FGTS_AUTHORIZATION
            }
        });

        apiCredentials.token = data.token;
        apiCredentials.expires = data.expira.split(' ')[1];

        return res.json(apiCredentials);

    } catch (error) {
        console.log(error);
        return res.json({ message: 'error' })
    }
});

router.post('/saldo', async (req, res) => {
    const { cpf } = req.body;
    const currentHour = new Date().getHours();
    const tokenExpiresHour = +apiCredentials?.expires?.split(':')[0];

    if(!apiCredentials?.token) {
        await getToken(apiCredentials);
    }

    if(apiCredentials.token && currentHour >= +tokenExpiresHour ) {
        await getToken(apiCredentials);
    }

    try {
        const { data } = await axios.get(`${process.env.FACTA_BASE_URL}/fgts/saldo?cpf=${cpf}`, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });
        console.log(data);
        return res.json(data)
    } catch (error) {
        return res.json({ message: 'error' })
    }
    
});

router.post('/calculo', async (req, res) => {
    const data = req.body;
    const headers = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiCredentials?.token}` }};

    try {
        const apiData = await axios.post(`${process.env.FACTA_BASE_URL}/fgts/calculo`, data, headers);
        console.log(apiData.data);
        return res.json(apiData.data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação'})
    }
    
});



module.exports = router;