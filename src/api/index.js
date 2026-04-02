const express = require('express');

const contaLuzRouter = require('./contaLuz');
const fgtsRouter = require('./fgts');
const consignadoRouter = require('./consignado');
const crefazRouter = require('./crefazOn');
const masterRouter = require('./masterLuz');
const contaLuzV2Router = require('./contaLuzV2');
const { createTokenMiddleware } = require('../middleware/tokenManager');

const router = express.Router();

router.get('/', (req, res) => {
    return res.json({ message: 'router api ok!' });
});

const contaLuzV1Middleware = createTokenMiddleware('v1');
const contaLuzV2Middleware = createTokenMiddleware('v2');


router.use('/conta-luz/v2', contaLuzV2Middleware, contaLuzRouter);
router.use('/conta-luz', contaLuzV1Middleware, contaLuzRouter);
router.use('/fgts', fgtsRouter);
router.use('/consignado', consignadoRouter);
router.use('/crefaz', crefazRouter);
router.use('/master', masterRouter);
router.use('/luz', contaLuzV2Router);

module.exports = router;