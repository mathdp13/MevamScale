const logBuffer = [];
const MAX_LOGS = 100;

function requestLogger(req, res, next) {
  if (req.originalUrl.startsWith('/api/logs')) return next();

  const start = Date.now();
  const log = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    requestBody: req.body && Object.keys(req.body).length ? req.body : undefined,
    status: null,
    responseTime: null,
    responseBody: null,
  };

  const originalJson = res.json.bind(res);
  res.json = function (data) {
    log.status = res.statusCode;
    log.responseTime = Date.now() - start;
    log.responseBody = data;
    logBuffer.unshift(log);
    if (logBuffer.length > MAX_LOGS) logBuffer.pop();
    return originalJson(data);
  };

  next();
}

function getLogs() {
  return logBuffer;
}

function clearLogs() {
  logBuffer.length = 0;
}

module.exports = { requestLogger, getLogs, clearLogs };
