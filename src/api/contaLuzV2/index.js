const { default: axios } = require("axios");
const express = require("express");
const { normalizeSimulationData } = require("../../utils/conta-luz");
const { createTokenMiddleware: createTokenMiddlewareV2  } = require('../../middleware/tokenManagerV2');

const router = express.Router();
const tokenMiddleware = createTokenMiddlewareV2();

router.post("/webhook", (req, res) => {
  console.log("[WEBHOOK DATA]: ", req.body);  
  return res.status(200).json({ ok: true })
});

router.use(tokenMiddleware);

router.get("/", (req, res) => {
  res.json({ ok: true });
});

router.post("/analyze", async(req, res) => {
  const { token } = req.apiCredentials;

  try {
    const reqData = normalizeSimulationData(req.body);
    const { data } = await axios.post(
    `${process.env.CREFAZ_BASE_URL_V2}/propostas/pre-analise`,
      reqData,
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

router.get("/analyze/offers/:id", async(req, res) => {
  const { id } = req.params;
  const { token } = req.apiCredentials;

  try {
    const { data } = await axios.get(
    `${process.env.CREFAZ_BASE_URL_V2}/propostas/${id}/produtos-ofertados`,      
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

router.post("/analyze/due-date/:id", async(req, res) => {
  const { token } = req.apiCredentials;
  const { id } = req.params;
  const reqData = req.body;

  try {
    const { data } = await axios.post(
    `${process.env.CREFAZ_BASE_URL_V2}/propostas/${id}/calculo-vencimento`,      
    reqData,
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

router.post("/analyze/credit-limit/:id", async(req, res) => {
  const { token } = req.apiCredentials;
  const { id } = req.params;
  const reqData = req.body;

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL_V2}/propostas/${id}/limite-credito`,      
      reqData,
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

router.post("/analyze/credit-simulation/:id", async(req, res) => {
  const { token } = req.apiCredentials;
  const { id } = req.params;
  const reqData = req.body;

  try {
    const { data } = await axios.post(
      `${process.env.CREFAZ_BASE_URL_V2}/propostas/${id}/simulacao-credito`,      
      reqData,
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

router.post("/analyze/proposal/:id/product-offer/:productId", async(req, res) => {
  const { token } = req.apiCredentials;
  const { id, productId } = req.params;
  const reqData = req.body;

  try {
    const { data } = await axios.put(
      `${process.env.CREFAZ_BASE_URL_V2}/propostas/${id}/produtos-ofertados/${productId}`,      
      reqData,
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

router.get('/analyze/process/:id', async(req, res) => {
  const { token } = req.apiCredentials;
  const { id } = req.params;

  try {
    const { data } = await axios.get(
      `${process.env.CREFAZ_BASE_URL_V2}/propostas/processamento/${id}`,
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
})

module.exports = router;
