const { getToken } = require('../functions/contaLuz');
const axios = require('axios');

const apiCredentials = {};

async function uploadImageToApi(userData) {    
    const { name, image } = userData.image;
    if(!apiCredentials?.token) await getToken(apiCredentials);    
    const currentDay = new Date();
    const expiresDay = new Date(apiCredentials.expires);
    if(currentDay >= expiresDay) await getToken(apiCredentials);
    
    const data = { documentoId: 1, conteudo: image }
    
    if(name === 'luz-image') data.documentoId = 30;

    await axios.put(`${process.env.CREFAZ_BASE_URL}/api/Proposta/${userData.id}/imagem`, data, {
        headers: {
            'Authorization': `Bearer ${apiCredentials?.token}`
        }
    });
}


module.exports = { uploadImageToApi };