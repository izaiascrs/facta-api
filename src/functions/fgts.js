const axios = require('axios');

async function getToken(apiCredentials) {
    try {
        const { data } = await axios.get(`${process.env.FACTA_BASE_URL}/gera-token`, {
            headers: {
                'Authorization': process.env.FGTS_AUTHORIZATION
            }
        });

        apiCredentials.token = data.token;
        apiCredentials.expires = data.expira.split(' ')[1];

        return apiCredentials;

    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = { getToken };
