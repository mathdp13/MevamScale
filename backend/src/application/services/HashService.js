const bcrypt = require('bcrypt');

class HashService {
  async hash(texto) {
    return bcrypt.hash(texto, 10);
  }

  async comparar(texto, hash) {
    return bcrypt.compare(texto, hash);
  }
}

module.exports = new HashService();
