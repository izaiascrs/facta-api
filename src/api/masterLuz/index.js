const express = require('express');
const {
  verifyMasterToken,
  saveSimulation,
  saveMasterProposal,
} = require('../../functions/masterLuz');

const router = express.Router();

router.get('/token', async (req, res) => {
  res.json({ message: 'token router' });
});

router.post('/simulation', async (req, res) => {
  await verifyMasterToken();
  try {
    const data = await saveSimulation(req.body);
    res.json(data);
  } catch (error) {
    const errorMessage = error?.response?.data ?? 'Simulation Error';
    res.status(400).json(errorMessage);
  }
});

router.post('/proposal', async (req, res) => {
  await verifyMasterToken();
  try {
    const data = await saveMasterProposal(req.body);
    res.json(data);
  } catch (error) {
    const errorMessage = error?.response?.data ?? 'Proposal Error';
    res.status(400).json(errorMessage);
  }
});

module.exports = router;
