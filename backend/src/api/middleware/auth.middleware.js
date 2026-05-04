const tokenService = require('../../application/services/TokenService');

const autenticarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado!' });

  try {
    req.user = tokenService.verificar(token);
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido!' });
  }
};

module.exports = { autenticarToken };
