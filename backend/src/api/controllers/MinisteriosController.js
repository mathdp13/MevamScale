const CriarMinisterioUseCase = require('../../application/usecases/ministerios/CriarMinisterioUseCase');
const EntrarMinisterioUseCase = require('../../application/usecases/ministerios/EntrarMinisterioUseCase');
const BuscarMembrosUseCase = require('../../application/usecases/ministerios/BuscarMembrosUseCase');
const BuscarMinisterioUseCase = require('../../application/usecases/ministerios/BuscarMinisterioUseCase');
const CriarFuncaoUseCase = require('../../application/usecases/ministerios/CriarFuncaoUseCase');
const ListarFuncoesUseCase = require('../../application/usecases/ministerios/ListarFuncoesUseCase');
const DeletarFuncaoUseCase = require('../../application/usecases/ministerios/DeletarFuncaoUseCase');
const SalvarFuncoesMembroUseCase = require('../../application/usecases/ministerios/SalvarFuncoesMembroUseCase');
const DeletarMinisterioUseCase = require('../../application/usecases/ministerios/DeletarMinisterioUseCase');
const PgMinisterioRepository = require('../../infrastructure/repositories/PgMinisterioRepository');

const ministerioRepo = new PgMinisterioRepository();

class MinisteriosController {
  async criar(req, res) {
    try {
      const result = await new CriarMinisterioUseCase(ministerioRepo).execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar ministerio: ' + err.message });
    }
  }

  async entrar(req, res) {
    try {
      const result = await new EntrarMinisterioUseCase(ministerioRepo).execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Erro ao entrar no ministerio.' });
    }
  }

  async buscar(req, res) {
    try {
      const result = await new BuscarMinisterioUseCase(ministerioRepo).execute(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
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

  async criarFuncao(req, res) {
    try {
      const result = await new CriarFuncaoUseCase(ministerioRepo).execute({
        ministerioId: req.params.id,
        nome: req.body.nome,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async listarFuncoes(req, res) {
    try {
      const result = await new ListarFuncoesUseCase(ministerioRepo).execute(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deletarFuncao(req, res) {
    try {
      const result = await new DeletarFuncaoUseCase(ministerioRepo).execute({
        funcaoId: req.params.funcaoId,
        ministerioId: req.params.id,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deletar(req, res) {
    try {
      await new DeletarMinisterioUseCase(ministerioRepo).execute({
        ministerioId: Number(req.params.id),
        usuarioId: Number(req.body.usuario_id),
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async salvarFuncoesMembro(req, res) {
    try {
      const result = await new SalvarFuncoesMembroUseCase(ministerioRepo).execute({
        usuarioId: req.body.usuario_id,
        ministerioId: req.params.id,
        funcaoIds: req.body.funcao_ids,
      });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new MinisteriosController();
