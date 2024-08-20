const express = require('express');

const contaLuzRouter = require('./contaLuz');
const fgtsRouter = require('./fgts');
const consignadoRouter = require('./consignado');
const crefazRouter = require('./crefazOn');
const masterRouter = require('./masterLuz');

const router = express.Router();

router.get('/', (req, res) => {
    return res.json({ message: 'router api ok!' });
});

router.use('/conta-luz', contaLuzRouter);
router.use('/fgts', fgtsRouter);
router.use('/consignado', consignadoRouter);
router.use('/crefaz', crefazRouter);
router.use('/master', masterRouter);

module.exports = router;