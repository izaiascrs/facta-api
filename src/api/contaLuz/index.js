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

const mockDataCitieAvailable = {
	"success": true,
	"data": {
		"produtos": {
			"energia": true,
			"boleto": true,
			"cp_refin": true,
			"consignado_privado": true,
			"cdc": true,
			"cp_cheque": true
		}
	},
	"errors": null
}

const createProposalMockData = {
	"success": true,
	"data": {
		"propostaId": 5175046
	},
	"errors": null
}

const offerMockData = {
	"success": true,
	"data": {
		"produtos": [
			{
				"id": 1,
				"nome": "Boleto",
				"tabelaJuros": [
					{
						"id": 1,
						"nome": "Tabela Boleto Padrão",
						"tabelaJurosValores": [
							{
								"id": 8,
								"plano": 8,
								"juros": 15
							},
							{
								"id": 9,
								"plano": 9,
								"juros": 15
							},
							{
								"id": 11,
								"plano": 11,
								"juros": 15
							},
							{
								"id": 12,
								"plano": 12,
								"juros": 15
							},
							{
								"id": 2523,
								"plano": 19,
								"juros": 15
							},
							{
								"id": 2524,
								"plano": 20,
								"juros": 15
							},
							{
								"id": 2525,
								"plano": 21,
								"juros": 15
							},
							{
								"id": 2526,
								"plano": 22,
								"juros": 15
							},
							{
								"id": 2527,
								"plano": 23,
								"juros": 15
							},
							{
								"id": 2528,
								"plano": 24,
								"juros": 15
							},
							{
								"id": 2983,
								"plano": 13,
								"juros": 15
							},
							{
								"id": 2984,
								"plano": 14,
								"juros": 15
							},
							{
								"id": 2985,
								"plano": 15,
								"juros": 15
							},
							{
								"id": 2986,
								"plano": 16,
								"juros": 15
							},
							{
								"id": 2987,
								"plano": 17,
								"juros": 15
							},
							{
								"id": 2988,
								"plano": 18,
								"juros": 15
							}
						]
					}
				],
				"convenio": []
			},
			{
				"id": 6,
				"nome": "Energia",
				"tabelaJuros": [],
				"convenio": [
					{
						"id": 4,
						"nome": "ENEL GO",
						"convenioDados": [
							{
								"convenioDadosId": 18,
								"convenioId": 4,
								"nome": "N° da instalação",
								"tipo": 1,
								"ordem": 1,
								"formato": "^([0]\\d{1,13}|[1-9]\\d{0,13})$",
								"mensagem": "N° da instalação inválido. Informe o N° da instalação."
							},
							{
								"convenioDadosId": 24,
								"convenioId": 4,
								"nome": "Data de Leitura",
								"tipo": 4,
								"ordem": 2,
								"mensagem": "Data inválida"
							},
							{
								"convenioDadosId": 22038,
								"convenioId": 4,
								"nome": "Data de Vencimento",
								"tipo": 4,
								"ordem": 3,
								"mensagem": "Data inválida"
							}
						],
						"tabelaJuros": [
							{
								"id": 2,
								"nome": "Tabela Energia Padrão",
								"tabelaJurosValores": [
									{
										"valor": 1200
									},
									{
										"valor": 1100
									},
									{
										"valor": 1000
									},
									{
										"valor": 900
									},
									{
										"valor": 800
									},
									{
										"valor": 700
									},
									{
										"valor": 600
									},
									{
										"valor": 500
									},
									{
										"valor": 450
									},
									{
										"valor": 400
									},
									{
										"valor": 350
									},
									{
										"valor": 300
									},
									{
										"valor": 250
									},
									{
										"valor": 200
									}
								]
							}
						]
					}
				]
			}
		],
		"proposta": {
			"nome": "izaias caio ribeiro silva",
			"cpf": "05671181186",
			"valorRendaPresumida": 1254.76
		}
	},
	"errors": null
}

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
    let value;

    const { firstName, lastName, phone, userMessageObj, offerId } = req.body;

    await contaLuzCreateUser({ first_name: firstName, last_name: lastName , phone });

    const id = await contaLuzGetUserIdByPhone({ userPhone: phone });

    const valueAvailable = await contaLuzGetValues({ propostaId: offerId });

    if(valueAvailable.valor) value = valueAvailable.valor;

    const messageSend = await sendUserInfoMessage({ userID: id , messageObj: userMessageObj, valueAvailable: value });

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

    console.log('token', apiCredentials.token)
    
    try {
        const { data } = await axios.get(`${process.env.CREFAZ_BASE_URL}/api/proposta/produtos-regiao/${citieID}`, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });

        return res.json(data);

    } catch (error) {
        // console.log(error.message);
        // console.log(error.response);
        // return res.json({ message: 'Error' });
        return res.json(mockDataCitieAvailable)
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
        // if (error.response) {
        //     res.status(error.response.status);
        //     return res.json(error.response.data)
        // }
        // res.status(400);        
        // return res.json({ message: 'Error' });
        return res.json(createProposalMockData);
    }
});


router.get('/offer/:id', async (req, res) => {
    const { id } = req.params;
   
    try {
        const { data } = await axios.get(`${process.env.CREFAZ_BASE_URL}/api/proposta/oferta-produto/${id}`, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });

        console.log(data);

        return res.json(data);

    } catch (error) {
        console.log(error.message);
        // if (error.response) {
        //     res.status(error.response.status);
        //     return res.json(error.response.data)
        // }
        // res.status(400);        
        // return res.json({ message: 'Error' });
        return res.json(offerMockData)
    }
});

async function contaLuzGetValues ({ propostaId }) {

    try {
        const { data } = await axios.get(`${process.env.CREFAZ_BASE_URL}/api/proposta/oferta-produto/${propostaId}`, {
            headers: {
                'Authorization': `Bearer ${apiCredentials?.token}`
            }
        });

        if(data.data) {
            const energyProd = data.data.produtos.find((prod) => prod.nome === 'Energia');
            const valueAvailable = energyProd.convenio[0].tabelaJuros[0].tabelaJurosValores[0];         
            if(valueAvailable) return valueAvailable;
            return 0;
        }

        return 0;
        
    } catch (error) {
        console.log(error.message);
        return 0;        
    }
}

module.exports = router;