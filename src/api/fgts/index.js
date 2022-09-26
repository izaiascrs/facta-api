const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const {
    getToken, 
    sendWhatsAppLink,
    fgtsSendFluxo,
    fgtsSendWhatsappMessage,
    whatsappCreateUser,
    whatsappGetUserIdByPhone 
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
    const data = req.body;
    const formData = new FormData();
    const headers = { headers: { 'Authorization': `Bearer ${apiCredentials?.token}` }};
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    
    try {
        const { data } = await axios.post(`${process.env.FACTA_BASE_URL}/proposta/etapa2-dados-pessoais`, formData, headers);
        console.log(data);
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação'})
    }
})

router.post('/proposal/create', async (req, res) => {
    const { id_simulador, codigo_cliente, first_name, last_name, phone } = req.body;
    const apiData = { id_simulador, codigo_cliente };
    const formData = new FormData();
    const headers = { headers: { 'Authorization': `Bearer ${apiCredentials?.token}` }};
    Object.entries(apiData).forEach(([key, value]) => formData.append(key, value));

    // const mockData = {
    //     "erro": false,
    //     "mensagem": "Proposta criada com sucesso",
    //     "codigo": "53662881",
    //     "url_formalizacao": "facta.ly/4e956e08"
    // }

    // await whatsappCreateUser({ first_name, last_name, phone });
    // const id = await whatsappGetUserIdByPhone({ userPhone: phone });
    // await fgtsSendFluxo({ userID: id });
    // await fgtsSendWhatsappMessage({userID: id, contractLink: mockData.url_formalizacao });

    // await sendWhatsAppLink({ codigo_af: mockData.codigo, apiCredentials });

    try {
        const { data } = await axios.post(`${process.env.FACTA_BASE_URL}/proposta/etapa3-proposta-cadastro`, formData, headers);
        console.log(data);
        
        await whatsappCreateUser({ first_name, last_name, phone });
        const id = await whatsappGetUserIdByPhone({ userPhone: phone });
        await fgtsSendFluxo({ userID: id });
        await fgtsSendWhatsappMessage({userID: id, contractLink: data.url_formalizacao });
        
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.json({ message: 'não foi possivel concluir a operação'})
    }

    // return res.json(mockData)
    
})


module.exports = router;