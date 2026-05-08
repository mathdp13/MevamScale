const PgEscalaRepository = require('../../infrastructure/repositories/PgEscalaRepository');
const CriarEscalaUseCase = require('../../application/usecases/escalas/CriarEscalaUseCase');
const ListarEscalasUseCase = require('../../application/usecases/escalas/ListarEscalasUseCase');
const DeletarEscalaUseCase = require('../../application/usecases/escalas/DeletarEscalaUseCase');
const GerarEscalasMesUseCase = require('../../application/usecases/escalas/GerarEscalasMesUseCase');
const CriarTipoCultoUseCase = require('../../application/usecases/escalas/CriarTipoCultoUseCase');
const ListarTiposCultoUseCase = require('../../application/usecases/escalas/ListarTiposCultoUseCase');
const DeletarTipoCultoUseCase = require('../../application/usecases/escalas/DeletarTipoCultoUseCase');
const AdicionarMembroEscalaUseCase = require('../../application/usecases/escalas/AdicionarMembroEscalaUseCase');
const RemoverMembroEscalaUseCase = require('../../application/usecases/escalas/RemoverMembroEscalaUseCase');
const ConfirmarPresencaUseCase = require('../../application/usecases/escalas/ConfirmarPresencaUseCase');
const ListarMembrosEscalaUseCase = require('../../application/usecases/escalas/ListarMembrosEscalaUseCase');

const repo = new PgEscalaRepository();

class EscalasController {
  async listar(req, res) {
    try {
      const { ministerioId, mes, ano } = req.query;
      const result = await new ListarEscalasUseCase(repo).execute({ ministerioId, mes, ano });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async criar(req, res) {
    try {
      const { ministerioId, nome, data_evento, data_ensaio, tipo_culto_id } = req.body;
      const result = await new CriarEscalaUseCase(repo).execute({
        ministerioId,
        nome,
        dataEvento: data_evento,
        dataEnsaio: data_ensaio,
        tipoCultoId: tipo_culto_id,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async deletar(req, res) {
    try {
      await new DeletarEscalaUseCase(repo).execute(req.params.escalaId);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async gerarMes(req, res) {
    try {
      const result = await new GerarEscalasMesUseCase(repo).execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async listarTiposCulto(req, res) {
    try {
      const result = await new ListarTiposCultoUseCase(repo).execute(req.params.ministerioId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async criarTipoCulto(req, res) {
    try {
      const result = await new CriarTipoCultoUseCase(repo).execute({
        ministerioId: req.params.ministerioId,
        nome: req.body.nome,
        diaSemana: req.body.dia_semana,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async deletarTipoCulto(req, res) {
    try {
      await new DeletarTipoCultoUseCase(repo).execute(req.params.tipoCultoId);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listarMembros(req, res) {
    try {
      const result = await new ListarMembrosEscalaUseCase(repo).execute(req.params.escalaId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async adicionarMembro(req, res) {
    try {
      const result = await new AdicionarMembroEscalaUseCase(repo).execute({
        escalaId: req.params.escalaId,
        usuarioId: req.body.usuario_id,
        funcaoId: req.body.funcao_id,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async removerMembro(req, res) {
    try {
      await new RemoverMembroEscalaUseCase(repo).execute({
        escalaId: req.params.escalaId,
        usuarioId: req.params.usuarioId,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async confirmarPresenca(req, res) {
    try {
      await new ConfirmarPresencaUseCase(repo).execute({
        escalaId: req.params.escalaId,
        usuarioId: req.params.usuarioId,
        confirmado: req.body.confirmado,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new EscalasController();
