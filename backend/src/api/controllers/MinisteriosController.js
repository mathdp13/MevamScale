const CriarMinisterioUseCase = require('../../application/usecases/ministerios/CriarMinisterioUseCase');
const EntrarMinisterioUseCase = require('../../application/usecases/ministerios/EntrarMinisterioUseCase');
const BuscarMembrosUseCase = require('../../application/usecases/ministerios/BuscarMembrosUseCase');
const PgMinisterioRepository = require('../../infrastructure/repositories/PgMinisterioRepository');

const ministerioRepo = new PgMinisterioRepository();

class MinisteriosController {
  async criar(req, res) {
    try {
      const result = await new CriarMinisterioUseCase(ministerioRepo).execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar ministério: ' + err.message });
    }
  }

  async entrar(req, res) {
    try {
      const result = await new EntrarMinisterioUseCase(ministerioRepo).execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Erro ao entrar no ministério.' });
    }
  }

  async buscarMembros(req, res) {
    try {
      const result = await new BuscarMembrosUseCase(ministerioRepo).execute(req.params.id);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar membros.' });
    }
  }
}

module.exports = new MinisteriosController();
