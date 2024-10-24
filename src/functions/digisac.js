const axios = require("axios");
require("dotenv/config");

const apiCredentials = {
  expires: "",
};

const digisacBaseApi = axios.create({
  baseURL: process.env.DIGISAC_BASE_URL,
});

digisacBaseApi.interceptors.request.use(
  async (config) => {
    if (config.url?.includes("token")) return config;
    let token = config.headers.Authorization;
    if (!token) {
      token = await login();
    }
    if (tokenExpires()) {
      token = await login();
    }
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function login() {
  const reqData = {
    grant_type: "password",
    client_id: "api",
    client_secret: "secret",
    username: process.env.DIGISAC_USER,
    password: process.env.DIGISAC_PASS,
  };
  try {
    const { data } = await digisacBaseApi.post("/oauth/token", reqData);
    const expires = new Date(); // current Date + 1 hour
    expires.setHours(expires.getHours() + 1);
    apiCredentials.expires = expires;
    return data.access_token;
  } catch (error) {
    console.log(error);
  }
}

async function tokenExpires() {
  const currentDay = new Date();
  const expiresDay = new Date(apiCredentials.expires);
  return currentDay >= expiresDay;
}

async function createContact(contact = {}) {
  const reqData = formatContactRequest(contact);

  try {
    const { data } = await digisacBaseApi.post("/contacts", reqData);
    return data;
  } catch (error) {
    console.log("ERROR TRYING CREATE USER", error);
  }
}

async function sendMessage(contact = {}) {
  const reqData = {
    type: "chat",
    serviceId: process.env.DIGISAC_SERVICE_ID,
    number: (contact.telefone ?? "").replace(/\D/g, ""),
    userId: process.env.DIGISAC_USER_ID,
    origin: "user",
    text: formatWtsMessage(contact),
  };
  try {
    const { data } = await digisacBaseApi.post("/messages", reqData);
    return data;
  } catch (error) {
    console.log("ERROR TRYING SEND MESSAGE", error);
  }
}

async function sendMessageWithDigisac(contact = {}) {
  try {
    await createContact(contact);
    await sendMessage(contact);
    return { ok: true };
  } catch (error) {
    console.log("ERROR", error?.message ?? error);    
  }
}

function formatContactRequest(contact = {}) {
  const reqData = {
    internalName: contact.nome,
    number: (contact.telefone ?? "").replace(/\D/g, ""),
    defaultDepartment: null,
    serviceId: process.env.DIGISAC_SERVICE_ID,
    tagIds: [process.env.DIGISAC_TAGS_ID],
    customFields: [
      {
        id: "988ac862-9309-4599-8f79-0502d7bade42",
        name: "valor",
        value: contact.valor ?? "900.00",
      },
      {
        id: "9fc3e32a-01ff-46f7-9992-e0abb30aeccb",
        name: "lote",
        value: contact.lote ?? "N/A",
      },
      {
        id: "c1fdbac5-f510-4ccb-baab-508ab97ef8d3",
        name: "instalacao",
        value: contact.instalacao ?? "N/A",
      },
      {
        id: "feff3096-96e6-4417-a770-b03d5d203532",
        name: "banco",
        value: contact.banco ?? "N/A",
      },
      {
        id: "5bca2805-d56a-497b-b9e0-ade9247e63cb",
        name: "cia",
        value: contact.cia ?? "N/A",
      },
      {
        id: "61803f0f-2bc4-49d4-a999-2d6fb4c0d6d1",
        name: "cidade",
        value: contact.cidade ?? "N/A",
      },
      {
        id: "6b504648-08e4-42c9-9869-c226a6f568d7",
        name: "estado",
        value: contact.estado ?? "N/A",
      },
      {
        id: "d850ec5a-28b7-4b62-8610-42933e0a6fe7",
        name: "nascimento",
        value: contact.nascimento ?? "N/A",
      },
      {
        id: "0ca715a3-0e11-4455-b6d1-680d28bc724e",
        name: "cpf",
        value: contact.cpf ?? "N/A",
      },
    ],
  };

  return reqData;
}

function formatWtsMessage(msgData = {}) {
  let message = "Olá, obrigado por realizar a simulação no nosso site!\n";
  message += "Seus dados Cadastrados\n";
  message += `Nome: ${msgData.nome}\n`;
  message += `CPF: ${msgData.cpf}\n`;
  message += `Data de nascimento: ${msgData.nascimento}\n`;
  message += `Valor: ${msgData.valor}\n`;
  message += `Telefone: ${msgData.telefone_formatado}\n`;
  message += `CEP: ${msgData.cep}\n`;
  message += `Companhia: ${msgData.cia}\n`;
  if (msgData.banco) message += `Banco: ${msgData.banco}\n`;
  if (msgData.instalacao) message += `Código Energia: ${msgData.instalacao}\n`;
  if (msgData.lote) message += `nLote/Rota: ${msgData.lote}\n`;
  message += "Confira seus dados para evitar erros na simulação.\n";
  message +=
    "Importante: Informações inconsistentes irão cancelar a simulação!\n";

  return message;
}

module.exports = {
  digisacBaseApi,
  sendMessageWithDigisac,
};
