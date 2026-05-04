const express = require('express');
const cors = require('cors');
const routes = require('./src/api/routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api', (req, res) => res.json({ status: 'ok', message: 'MevamScale API' }));
app.use('/api', routes);

module.exports = app;
