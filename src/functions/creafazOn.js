const axios = require('axios');

const BASE_URL = process.env.CREFAZ_API_URL;

const CRIVE_BASE_URL = process.env.CRIVE_BASE_URL;

const apiCredentials = {};

function verifyToken() {
  if (!apiCredentials.token) throw new Error('invalid request!');
  const currentDay = new Date();
  const expiresDay = new Date(apiCredentials.expires);
  if (currentDay > expiresDay) throw new Error('invalid request!');
}

async function login(authData) {
  const { data } = await axios.post(`${BASE_URL}/Usuario/login`, {
    ...authData,
  });

  if (data) {
    const expiresDay = data.data.expires.split('T')[0];
    apiCredentials.token = data.data.token;
    apiCredentials.expires = expiresDay.replace(/-/g, '/');
  }
  return data;
}

async function getProposalById({ proposalId = '' }) {
  verifyToken();

  const { data } = await axios.get(
    `${BASE_URL}/proposta/entrada-mesa-de-credito/${proposalId}`,
    {
      headers: {
        Authorization: `Bearer ${apiCredentials?.token}`,
      },
    }
  );

  return data;
}

async function createProposal({ proposalData = {} }) {
  verifyToken();

  const { data } = await axios.post(
    `${BASE_URL}/proposta`,
    { ...proposalData },
    {
      headers: {
        Authorization: `Bearer ${apiCredentials?.token}`,
      },
    }
  );

  return data;
}

async function updateProposal({ proposalId = '', proposalData = {} }) {
  verifyToken();

  const { data } = await axios.put(
    `${BASE_URL}/proposta/pre-analise/${proposalId}`,
    { ...proposalData },
    {
      headers: {
        Authorization: `Bearer ${apiCredentials?.token}`,
      },
    }
  );

  return data;
}

async function initiateCrive({ criveData = {} }) {
  verifyToken();

  const { data } = await axios.post(
    `${CRIVE_BASE_URL}/Crivo/acionamento`,
    { ...criveData },
    {
      headers: {
        Authorization: `Bearer ${apiCredentials.token}`,
      },
    }
  );

  return data;
}

async function getOffers({ proposalId = '' }) {
  verifyToken();

  const { data } = await axios.get(
    `${BASE_URL}/proposta/oferta-produto/${proposalId}`,
    {
      headers: {
        Authorization: `Bearer ${apiCredentials?.token}`,
      },
    }
  );

  return data;
}

async function simulateParcels({parcelData} = {}) {
  verifyToken();
  const { data } = await axios.post(`${BASE_URL}/proposta/simulacao-prestacao`, { ...parcelData }, {
    headers: {
      Authorization: `Bearer ${apiCredentials?.token}`,
    },
  });
  return data;
}

async function updateProposalValues({ proposalID, updatedData } = {}) {
  verifyToken();
  const { data } = await axios.put(
    `${BASE_URL}/proposta/${proposalID}`,
    { ...updatedData },
    {
      headers: {
        Authorization: `Bearer ${apiCredentials?.token}`,
      },
    }
  );

  return data;
}

module.exports = {
  login,
  getProposalById,
  updateProposal,
  initiateCrive,
  getOffers,
  createProposal,
  simulateParcels,
  updateProposalValues
};
