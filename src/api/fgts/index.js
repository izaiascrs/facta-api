const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const {
    getToken, 
    sendWhatsAppLink,
    fgtsSendFluxo, //
    fgtsSendWhatsappMessage, //
    whatsappCreateUser,
    whatsappGetUserIdByPhone,
    notifyFgtsStatus, //
    fgtsSendBotFluxo, //
    fgtsSendSimulationMsg,
    fgtsSendContractLinkMsg,
    fgtsSendBotSimulationMsg,
    fgtsNotifyAline
} = require('../../functions/fgts'); 

const router = express.Router();

const apiCredentials = {}
const cache = {}
let currentHour;
let tokenExpiresHour;


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
        
    if(!apiCredentials?.token) await getToken(apiCredentials);
    
    const { cpf } = req.body;   
    const currentHour = new Date().getHours();
    const tokenExpiresHour = +apiCredentials?.expires?.split(':')[0];
    const currentDay = new Date().toLocaleString('pt-br', { weekday: 'long' });
    const expiresDay = new Date(apiCredentials.day).toLocaleString('pt-br', { weekday: 'long' });

    if(apiCredentials.token && currentHour >= +tokenExpiresHour ) {
        await getToken(apiCredentials);
    } else if(apiCredentials.day && expiresDay !== currentDay ) {
        console.log(true);
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

router.post('/state/cities', async (req, res) => {
    const { stateUF } = req.body;     
    if(cache[stateUF]) {
        console.log('cache data');
        return res.json(cache[stateUF]);
    } 
    
    if(!apiCredentials?.token) {
        console.log('start get token');
        await getToken(apiCredentials);
        console.log('finish get token');

        currentHour = new Date().getHours();
        tokenExpiresHour = +apiCredentials?.expires?.split(':')[0];
    }

    if(apiCredentials.token && currentHour >= +tokenExpiresHour ) {
        await getToken(apiCredentials);
    }


    try {
        const apiData = await axios.get(`${process.env.FACTA_BASE_URL}/proposta-combos/cidade?estado=${stateUF}`, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });

        const sorted = Object.entries(apiData.data.cidade).sort(([, a], [, b]) => {
            return a.nome > b.nome ? 1 : a.nome < b.nome ? - 1 : 0;
        });

        apiData.data.cidade = sorted
        cache[stateUF] = apiData.data;
        return res.json(apiData.data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação'})
    }
    
})

router.post('/simulate/create', async (req, res) => {
    const defaultParams = { produto: "D", tipo_operacao: "13", averbador: "20095", convenio: "3", login_certificado: "93231" }
    const bodyData = { ...defaultParams, ...req.body  };
    const formData = new FormData();

    Object.entries(bodyData).forEach(([key, value]) => formData.append(key, value));
    const headers = { headers: { 'Authorization': `Bearer ${apiCredentials?.token}` }};

    try {
        const { data } = await axios.post(`${process.env.FACTA_BASE_URL}/proposta/etapa1-simulador`, formData, headers);
        console.log(data);
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação'})
    }
})

router.post('/user/create', async (req, res) => {
    const userData = req.body;
    const formData = new FormData();
    const headers = { headers: { 'Authorization': `Bearer ${apiCredentials?.token}` }};
    
    try {
        console.log({userData})
        Object.entries(userData).forEach(([key, value]) => formData.append(key, value));
        const { data } = await axios.post(`${process.env.FACTA_BASE_URL}/proposta/etapa2-dados-pessoais`, formData, headers);
        console.log(data);
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação' })
    }
})

router.post('/proposal/create', async (req, res) => {
    const { id_simulador, codigo_cliente, first_name, last_name, phone } = req.body;
    const apiData = { id_simulador, codigo_cliente };
    const formData = new FormData();
    const headers = { headers: { 'Authorization': `Bearer ${apiCredentials?.token}` }};
    
    try {
        console.log({ apiData });
        Object.entries(apiData).forEach(([key, value]) => formData.append(key, value));
        const { data } = await axios.post(`${process.env.FACTA_BASE_URL}/proposta/etapa3-proposta-cadastro`, formData, headers);        
        const telefone = phone.replace('+', '');
        // await fgtsSendSimulationMsg({ telefone });
        await fgtsSendContractLinkMsg({ contractLink: data.url_formalizacao, nome: first_name , telefone: telefone });
        await fgtsNotifyAline({ status: 'done', nome: first_name });
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação'})
    }    
})

router.post('/proposal/send-status', async (req, res) => {
    const { name } = req.body;    
    await fgtsNotifyAline({ status: 'pending', nome: name })
    return res.json({ ok: true });
})

router.post('/bot-token', async(req, res) => {
    const token = req.body.token;    

    if(!token) return res.json({ error: 'No Token Provided' })

    try {
        const { data } = await axios.get(`https://webservice-homol.facta.com.br/gera-token`, {
            headers: {
                'Authorization': token,
            }
        });

        return res.json(data);

    } catch (error) {
        console.log(error);
        return res.json({ message: 'error' })
    }
})

router.post('/bot-saldo', async (req, res) => {
    const { cpf, token } = req.body;    
    try {
        const { data } = await axios.get(`https://webservice-homol.facta.com.br/fgts/saldo?cpf=${cpf}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(data);
        return res.json(data)
    } catch (error) {
        console.log(error.message);
        return res.json({ message: 'error' })
    }
    
});

router.post('/bot-message', async (req, res) => {
	const { first_name, phone } = req.body;
    try {        
        const telefone = phone?.replace('+', '')
        const msgSent =  await fgtsSendBotSimulationMsg({ nome: first_name, telefone });
        if(!msgSent) return res.status(400).json({ error: 'Unable to send message'});
        return res.json({ message: 'Bot message sent' });
    } catch(error) {
        console.log(error);
        return res.status(400).json({ error: 'Unable to send message' });
    }
})

module.exports = router;