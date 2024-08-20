const axios = require('axios');
require('dotenv').config();

const apiCredentials = {};

const MASTER_BASE_URL = process.env.MASTER_BASE_URL;

async function getToken() {
  const userCredentials = {
    usuario: process.env.MASTER_USER,
    senha: process.env.MASTER_PASS,
  };

  try {
    const { data } = await axios.post(
      `${MASTER_BASE_URL}/token`,
      userCredentials
    );

    const today = new Date();
    today.setHours(today.getHours() + 1);
    apiCredentials.token = data.accessToken;
    apiCredentials.expires = today;

    return apiCredentials;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function verifyMasterToken() {
  if (!apiCredentials?.token) {
    await getToken(apiCredentials);
  }

  const currentDay = new Date();
  const expiresDay = new Date(apiCredentials.expires);
  if (currentDay >= expiresDay) await getToken(apiCredentials);
}

async function saveSimulation(simulationData) {
  const postData = {
    ...simulationData,
    canalVendas: 1339,
    valorFinanciado: 0,
    qtdParcelas: 0,
    usuario: process.env.MASTER_USER,
    simulaSeguro: false,
    aceiteCliente: true,
    ip: '187.16.129.5',
    coordenada: '32763 -32113',
    dataAceite: new Date().toISOString(),
  };

  const headers = {
    headers: {
      Authorization: `Bearer ${apiCredentials?.token}`,
    },
  }

  const { data } = await axios.post(
    `${MASTER_BASE_URL}/cpfl/consignado/v1/simulacao`,
    postData,
    headers
  );

  return data;

}

module.exports = {
  getToken,
  verifyMasterToken,
  saveSimulation,
};
