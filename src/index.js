const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

const api = require('./api');

const limiter = rateLimit({
    windowMs: 20 * 1000, // 30 seconds
    max: 8 
})

const speedLimiter = slowDown({
    windowMs: 20 * 1000, // 30 seconds
    delayAfter: 1,
    delayMs: 250
})

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter, speedLimiter);

app.get('/', (req, res) => {
    res.json({ ok: true })
})

app.use('/api/', api);

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`app is running ${PORT}`));