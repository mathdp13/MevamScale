const CriarUsuarioUseCase = require('../../application/usecases/usuarios/CriarUsuarioUseCase');
const BuscarUsuarioUseCase = require('../../application/usecases/usuarios/BuscarUsuarioUseCase');
const AtualizarUsuarioUseCase = require('../../application/usecases/usuarios/AtualizarUsuarioUseCase');
const AtualizarSkillsUseCase = require('../../application/usecases/usuarios/AtualizarSkillsUseCase');
const BuscarMinisteriosUseCase = require('../../application/usecases/usuarios/BuscarMinisteriosUseCase');
const PgUsuarioRepository = require('../../infrastructure/repositories/PgUsuarioRepository');
const PgMinisterioRepository = require('../../infrastructure/repositories/PgMinisterioRepository');
const hashService = require('../../application/services/HashService');

const usuarioRepo = new PgUsuarioRepository();
const ministerioRepo = new PgMinisterioRepository();

class UsuariosController {
  async criar(req, res) {
    try {
      const result = await new CriarUsuarioUseCase(usuarioRepo, hashService).execute(req.body);
      res.status(201).json(result);
    } catch {
      res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
  }

  async buscar(req, res) {
    try {
      const result = await new BuscarUsuarioUseCase(usuarioRepo).execute(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Erro ao buscar usuário.' });
    }
  }

  async atualizar(req, res) {
    try {
      const result = await new AtualizarUsuarioUseCase(usuarioRepo).execute(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async atualizarSkills(req, res) {
    try {
      const result = await new AtualizarSkillsUseCase(usuarioRepo).execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async buscarMinisterios(req, res) {
    try {
      const result = await new BuscarMinisteriosUseCase(ministerioRepo).execute(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listarTodos(req, res) {
    try {
      if (!req.user?.superadmin) return res.status(403).json({ error: 'Acesso negado.' });
      const result = await usuarioRepo.listarTodos();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async atualizarPermissoes(req, res) {
    try {
      if (!req.user?.superadmin) return res.status(403).json({ error: 'Acesso negado.' });
      await usuarioRepo.atualizarPermissoes(req.params.id, req.body);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new UsuariosController();
