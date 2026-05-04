const LoginUseCase = require('../../application/usecases/auth/LoginUseCase');
const LoginGoogleUseCase = require('../../application/usecases/auth/LoginGoogleUseCase');
const PgUsuarioRepository = require('../../infrastructure/repositories/PgUsuarioRepository');
const hashService = require('../../application/services/HashService');
const tokenService = require('../../application/services/TokenService');
const googleAuthProvider = require('../../infrastructure/external/GoogleAuthProvider');

const usuarioRepo = new PgUsuarioRepository();

class AuthController {
  async login(req, res) {
    try {
      const result = await new LoginUseCase(usuarioRepo, hashService, tokenService).execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Erro interno.' });
    }
  }

  async loginGoogle(req, res) {
    try {
      const result = await new LoginGoogleUseCase(usuarioRepo, googleAuthProvider, tokenService).execute(req.body);
      res.json(result);
    } catch {
      res.status(401).json({ error: 'Falha na autenticação com Google.' });
    }
  }
}

module.exports = new AuthController();
