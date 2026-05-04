const jwt = require('jsonwebtoken');

class TokenService {
  gerar(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  }

  verificar(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}

module.exports = new TokenService();
