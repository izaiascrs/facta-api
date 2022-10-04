const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const api = require('./api');
const morgan = require('morgan');

require('dotenv').config();

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors());
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.json({ ok: true })
})

app.use('/api/', api);

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`app is running ${PORT}`));