const express = require("express");
const axios = require("axios");
const multer = require("multer");
const {
  uploadQueue,
  googleSheetQueue,
  updateUserQueue,
  proposalStatusMessageQueue,
} = require("../../lib/Queue");

const multerConfig = require("../../config/multer");
const cities = require("../../../cities.json");

const {
  getToken,
  contaLuzCreateUser,
  contaLuzGetUserIdByPhone,
  contaLuzSendWhatsappMessage,
  normalizeData,
  sendProposalIDAndLinkMessage,
  sendSiteSimulationsMsg,
  sendBotAnaliseMessage,
  searchProposalByID,
} = require("../../functions/contaLuz");
const {
  createEnergyTokenMiddleware,
} = require("../../middleware/crefazOnTokenManager");

const router = express.Router();
const apiCredentials = {};

const delay = 1000 * 20; // 20 seconds

const options = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const mockDataCitieAvailable = {
  success: true,
  data: {
    produtos: {
      energia: true,
      boleto: true,
      cp_refin: true,
      consignado_privado: true,
      cdc: true,
      cp_cheque: true,
    },
  },
  errors: null,
};

router.get("/", (req, res) => {
  return res.json({ message: "conta luz router ok!" });
});

router.post("/user/create", async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  await contaLuzCreateUser({
    first_name: firstName,
    last_name: lastName,
    phone,
  });

  const id = await contaLuzGetUserIdByPhone({ userPhone: phone });

  const messageSend = await contaLuzSendWhatsappMessage({ userID: id });

  if (messageSend) {
    return res.json({ message: "message sent" });
  }

  res.status(401);
  return res.json({ message: "unable to send message" });
});

router.post("/user/create-v2", async (req, res) => {
  const { phone, userMessageObj } = req.body;
  const Telefone = phone?.replace("+", "") || "N/A";

  const messageSent = await sendSiteSimulationsMsg({
    messageObj: {
      ...userMessageObj,
      Telefone,
      telefone_formatado: userMessageObj.Telefone,
    },
  });

  if (messageSent.ok) {
    return res.json({ message: "message sent" });
  }

  res.status(401);
  return res.json({ message: "unable to send message" });
});

router.post("/send-link", async (req, res) => {
  const { firstName, lastName, phone, offerId, page } = req.body;

  await contaLuzCreateUser({
    first_name: firstName,
    last_name: lastName,
    phone,
  });

  const id = await contaLuzGetUserIdByPhone({ userPhone: phone });

  const messageSend = await sendProposalIDAndLinkMessage({
    name: firstName,
    proposalID: offerId,
    userID: id,
    page,
  });

  if (!messageSend) {
    res.status(401);
    return res.json({ message: "unable to send message" });
  }

  return res.json({ message: "message sent" });
});

router.get("/token", async (req, res) => {
  try {
    await getToken(apiCredentials);
    return res.json(apiCredentials);
  } catch (error) {
    console.log(error);
    return res.json({ message: "Unable to Login" });
  }
});

router.post("/citie-available", async (req, res) => {
  const { citieID } = req.body;
  const { token } = req.apiCredentials;

  try {
    const { data } = await axios.get(
      `${process.env.CREFAZ_BASE_URL}/api/proposta/produtos-regiao/${citieID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    // console.log(error.message);
    // console.log(error.response);
    // return res.json({ message: 'Error' });
    return res.json(mockDataCitieAvailable);
  }
});

router.post("/create-proposal", async (req, res) => {
  const userData = req.body;
  const state = userData.estado;
  const userCity = userData.cidade;
  const cityID =
    cities[state]?.find((city) => city?.nome === userCity)?.id ?? 0;
  userData.citieID = cityID;
  const { token } = req.apiCredentials;

  const formattedData = normalizeData(userData, req.userVersion ?? "v1");

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/proposta`,
      formattedData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log(error.message);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.get("/offer/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.apiCredentials;

  try {
    const { data } = await axios.get(
      `${process.env.CREFAZ_BASE_URL}/api/proposta/oferta-produto/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log("error", error.message);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/due-date", async (req, res) => {
  const { propostaId, produtoId, tabelaJurosId } = req.body;
  const apiData = { propostaId, produtoId, tabelaJurosId };
  const { token } = req.apiCredentials;

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/Proposta/calculo-vencimento`,
      apiData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log(error);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/product-offer/:id", async (req, res) => {
  const apiData = req.body;
  const { id } = req.params;
  const { token } = req.apiCredentials;

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/Proposta/simulacao-valor/${id}`,
      apiData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log(error);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/product-offer/max-value/:id", async (req, res) => {
  const apiData = req.body;
  const { token } = req.apiCredentials;
  const { id } = req.params;

  if (!id) {
    res.status(400);
    return res.json({ message: "Proposal ID is missing" });
  }

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/Proposta/consulta-valor-limite/${id}`,
      apiData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log(error);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/update-proposal", async (req, res) => {
  const apiData = req.body;
  const { token } = req.apiCredentials;

  try {
    await axios.put(
      `${process.env.CREFAZ_BASE_URL}/api/Proposta/oferta-produto/${apiData.id}`,
      apiData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/proposal/analyze/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.apiCredentials;

  const proposalData = {
    ...req.body,
    unidade: {
      nomeVendedor: process.env.CREFAZ_VENDOR_NAME,
      cpfVendedor: process.env.CREFAZ_VENDOR_CPF,
      celularVendedor: process.env.CREFAZ_VENDOR_PHONE,
    },
  };

  if (!id) {
    res.status(400);
    return res.json({ message: "Proposal ID is missing" });
  }

  try {
    const { data } = await axios.put(
      `${process.env.CREFAZ_BASE_URL}/api/proposta/${id}`,
      proposalData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status);
      console.log(error.response.data);
      return res.json(error.response.data);
    }
    console.log(error);
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post(
  "/image/upload",
  multer(multerConfig).array("images", 3),
  async (req, res) => {
    const { files } = req;
    const fileInfo = { files, folderName: req.body.nome };
    const date = new Date(
      new Date().toLocaleString("en", { timeZone: "America/Sao_Paulo" })
    );
    const today = new Intl.DateTimeFormat("pt-br", options).format(date);

    const valor = req.body["valor"]?.replace(/\D/g, "");

    const userData = {
      ...req.body,
      valor: valor,
      timestamp: today,
    };

    if (!files.length) {
      await googleSheetQueue.add(
        { userData, hasImage: false },
        { attempts: 3, backoff: delay }
      );
    } else {
      await uploadQueue.add({ fileInfo, userData, hasImage: true });
    }

    res.json({ ok: true });
  }
);

router.post("/document/upload/:id", async (req, res) => {
  const { id } = req.params;
  const { conteudo, documentoId } = req.body;
  const apiData = { conteudo, documentoId };
  const { token } = req.apiCredentials;

  if (!id) {
    res.status(400);
    return res.json({ message: "Documento ID is missing" });
  }

  if (!conteudo || !documentoId) {
    res.status(400);
    return res.json({ message: "Conteudo or documentoId is missing" });
  }

  try {
    const { data } = await axios.put(
      `${process.env.CREFAZ_BASE_URL}/api/proposta/${id}/imagem`,
      apiData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log(error);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/acompanhamento", async (req, res) => {
  console.log("@webhook/acompanhamento", req.body);
  const { situacaoDescricao = "" } = req.body;

  if (
    situacaoDescricao === "Aguard. Assinatura" ||
    situacaoDescricao === "Aguard. Análise"
  ) {
    await proposalStatusMessageQueue.add(
      {
        token: req.apiCredentials.token,
        propostaId: req.body?.propostaId,
        status: req.body?.situacaoDescricao,
        userVersion: req?.userVersion,
      },
      { attempts: 3, backoff: delay }
    );
  }

  return res.json({ ok: true });
});

async function contaLuzGetValues({ propostaId }) {
  // api/Proposta/oferta-produto
  const { token } = req.apiCredentials;

  try {
    const { data } = await axios.get(
      `${process.env.CREFAZ_BASE_URL}/api/proposta/oferta-produto/${propostaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.data) {
      const energyProd = data.data.produtos.find(
        (prod) => prod.nome === "Energia"
      );
      const valueAvailable =
        energyProd.convenio[0].tabelaJuros[0].tabelaJurosValores[0];
      if (valueAvailable) return valueAvailable;
      return 0;
    }

    return 0;
  } catch (error) {
    console.log(error.message);
    return 0;
  }
}

router.get("/proposal/search/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      res.status(404);
      return res.json({ message: "Proposal not found!" });
    }

    const data = await searchProposalByID({
      proposalID: id,
      token: req.apiCredentials.token,
    });

    if (data.success) {
      const resData = {
        id: data.data.proposta.id,
        status: data.data.proposta.situacaoDescricao,
        name: data.data.proposta.cliente.nome,
      };
      return res.json(resData);
    } else {
      res.status(404);
      return res.json({ message: "Proposal not found!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({ error: "Something went wrong" });
  }
});

router.get("/simulation/search/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      res.status(404);
      return res.json({ message: "Proposal not found!" });
    }

    const data = await searchProposalByID({
      proposalID: id,
      token: req.apiCredentials.token,
    });

    if (data.success) {
      return res.json(data);
    } else {
      res.status(404);
      return res.json({ message: "Proposal not found!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({ error: "Something went wrong" });
  }
});

router.post("/state/cities", async (req, res) => {
  const { uf } = req.body;
  const { token } = req.apiCredentials;

  if (!uf) {
    res.status(400);
    return res.json({ message: "UF is required" });
  }

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL}/api/endereco/cidade`,
      { uf },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(data);
  } catch (error) {
    console.log(error);
    if (error.response) {
      res.status(error.response.status);
      return res.json(error.response.data);
    }
    res.status(400);
    return res.json({ message: "Error" });
  }
});

router.post("/bot-message", async (req, res) => {
  const { first_name, last_name, phone, valueAvailable } = req.body;

  try {
    const msgSent = await sendBotAnaliseMessage({ userData: req.body });
    if (!msgSent.ok)
      return res.status(400).json({ error: "Unable to send message" });
    return res.json({ message: "Bot message sent" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Unable to send message" });
  }
});

router.post("/proposal/search-by-cpf", async (req, res) => {
  const { cpf } = req.body;

  if (!cpf) {
    res.status(404);
    return res.json({ message: "Invalid CPF!" });
  }

  try {
    const data = await searchByCPF({ cpf, token: req.apiCredentials.token });
    if (!data.success) {
      res.status(404);
      return res.json({ message: "Something went wrong!" });
    }

    const {
      id,
      situacaoDescricao: status,
      cliente: name,
      situacaoId,
    } = data.data.itens[0];
    return res.json({ id, status, name, situacaoId });
  } catch (error) {
    console.log(error);
    res.status(404);
    return res.json(error);
  }
});

async function searchByCPF({ cpf = "", token }) {
  if (!token) {
    return { success: false, data: { message: "Token is required" } };
  }

  const searchData = {
    pagina: 1,
    filtroDinamico: cpf,
    ordenacaoAsc: false,
  };

  try {
    const { data } = await axios.post(
      `https://api.crefazon.com.br/api/proposta/acompanhamento`,
      searchData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
}

const energyTokenMiddleware = createEnergyTokenMiddleware();

router.post(
  "/proposal/energy/validate",
  energyTokenMiddleware,
  async (req, res) => {
    const { token = "" } = req.crefazOnApiCredentials;
    const { id, operacao } = req.body;

    if (!id || !operacao) {
      res.status(400);
      return res.json({ message: "ID and operation are required" });
    }

    try {
      const data = await updateEnergyDataForValidate(token, { id, operacao });
      if (!data.success) {
        res.json({
          success: false,
          data: { unidadeCorreta: false },
          message: "Error updating energy data",
        });
        return;
      }

      const { integracaoCrivo } = data.data;

      if (!integracaoCrivo) {
        res.json({
          success: false,
          data: { unidadeCorreta: false },
          message: "Invalid energy data",
        });
        return;
      }

      const validateData = await validateEnergyData(token, {
        propostaId: id,
        ...integracaoCrivo,
      });

      if (!validateData.success || validateData.data.unidadeCorreta === false) {
        res.json({
          success: true,
          data: {
            unidadeCorreta: validateData.data.unidadeCorreta,
          },
        });
        return;
      }

      return res.json({
        success: true,
        data: {
          unidadeCorreta: validateData.data.unidadeCorreta,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(400);
      return res.json({
        success: false,
        data: { unidadeCorreta: false },
        message: "Error trying to validate energy data",
      });
    }
  }
);

async function updateEnergyDataForValidate(token, energyData) {
  const { id } = energyData;

  try {
    const { data } = await axios.put(
      `${process.env.CREFAZ_ON_URL}/proposta/oferta-produto-consultar-crivo/${id}`,
      energyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function validateEnergyData(token, energyData) {
  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_ON_CRIVE_URL}/crivo/acionamento`,
      energyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
}

module.exports = router;
