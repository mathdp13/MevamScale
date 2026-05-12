const express = require('express');
const cors = require('cors');
const routes = require('./src/api/routes');
const { requestLogger, getLogs, clearLogs } = require('./src/api/middleware/request-logger.middleware');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestLogger);

app.get('/api', (req, res) => res.json({ status: 'ok', message: 'MevamScale API' }));
app.get('/api/logs', (req, res) => res.json(getLogs()));
app.delete('/api/logs-clear', (req, res) => { clearLogs(); res.json({ ok: true }); });
app.use('/api', routes);

module.exports = app;
