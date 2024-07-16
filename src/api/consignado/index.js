const express = require('express');
const axios = require('axios');
const CONSIGNADO_WEBHOOK = process.env.CONSIGNADO_WEBHOOK_LINK;

const router = express.Router();

router.post('/message', async (req, res, next) => {
  const data = req.body;
  if(!data) {
    res.status(400);
    next(new Error('Invalid request'));
    return;
  }
  
  const formattedData = {
    ...data,
    whatsapp: `55${data?.whatsapp?.replace(/\D/g, '')}`,
    event: "EMPRESTIMO_CONSIGNADO"
  }

  try {
    await sendConsignadoMessage(formattedData);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  } 
  
});

async function sendConsignadoMessage(messageData) {
  const { data } = await axios.post(CONSIGNADO_WEBHOOK, messageData);
  return data;
}

module.exports = router;