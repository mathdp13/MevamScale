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
const ListarAgendaUseCase = require('../../application/usecases/escalas/ListarAgendaUseCase');
const ListarAgendaGeralUseCase = require('../../application/usecases/escalas/ListarAgendaGeralUseCase');
const ListarStatsUseCase = require('../../application/usecases/escalas/ListarStatsUseCase');
const CriarAusenciaUseCase = require('../../application/usecases/escalas/CriarAusenciaUseCase');
const ListarAusenciasUseCase = require('../../application/usecases/escalas/ListarAusenciasUseCase');
const DeletarAusenciaUseCase = require('../../application/usecases/escalas/DeletarAusenciaUseCase');
const CriarSubstituicaoUseCase = require('../../application/usecases/escalas/CriarSubstituicaoUseCase');
const ListarSubstituicoesUseCase = require('../../application/usecases/escalas/ListarSubstituicoesUseCase');
const AtualizarSubstituicaoUseCase = require('../../application/usecases/escalas/AtualizarSubstituicaoUseCase');

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

  async salvarFormacaoItem(req, res) {
    try {
      const { tipoCultoId } = req.params;
      const { funcao_id, quantidade } = req.body;
      const result = await repo.salvarFormacaoItem({ tipoCultoId: Number(tipoCultoId), funcaoId: Number(funcao_id), quantidade: Number(quantidade) || 1 });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async removerFormacaoItem(req, res) {
    try {
      const { tipoCultoId, funcaoId } = req.params;
      await repo.removerFormacaoItem({ tipoCultoId: Number(tipoCultoId), funcaoId: Number(funcaoId) });
      res.json({ ok: true });
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

  async agenda(req, res) {
    try {
      const { usuarioId, mes, ano } = req.query;
      const result = await new ListarAgendaUseCase(repo).execute({ usuarioId, mes, ano });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async agendaGeral(req, res) {
    try {
      const { mes, ano, ministerioId } = req.query;
      const result = await new ListarAgendaGeralUseCase(repo).execute({ mes, ano, ministerioId: ministerioId ? Number(ministerioId) : null });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async stats(req, res) {
    try {
      const result = await new ListarStatsUseCase(repo).execute({ ministerioId: req.params.id });
      res.json(result);
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

  async criarAusencia(req, res) {
    try {
      const { usuario_id, ministerio_id, data, motivo } = req.body;
      const result = await new CriarAusenciaUseCase(repo).execute({ usuarioId: usuario_id, ministerioId: ministerio_id, data, motivo });
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async listarAusencias(req, res) {
    try {
      const { ministerioId, mes, ano } = req.query;
      const result = await new ListarAusenciasUseCase(repo).execute({ ministerioId, mes, ano });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deletarAusencia(req, res) {
    try {
      const usuarioId = req.user?.id || req.query.usuario_id || req.body?.usuario_id;
      await new DeletarAusenciaUseCase(repo).execute({ id: req.params.id, usuarioId });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async criarSubstituicao(req, res) {
    try {
      const { escala_id, solicitante_id, motivo } = req.body;
      const result = await new CriarSubstituicaoUseCase(repo).execute({ escalaId: escala_id, solicitanteId: solicitante_id, motivo });
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async listarSubstituicoes(req, res) {
    try {
      const { ministerioId, status } = req.query;
      const result = await new ListarSubstituicoesUseCase(repo).execute({ ministerioId, status });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async atualizarSubstituicao(req, res) {
    try {
      const result = await new AtualizarSubstituicaoUseCase(repo).execute({ id: req.params.id, status: req.body.status });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async listarSetlist(req, res) {
    try {
      const result = await repo.listarSetlist(req.params.escalaId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async adicionarSetlist(req, res) {
    try {
      const { musica_id, tom } = req.body;
      const result = await repo.adicionarSetlist({ escalaId: req.params.escalaId, musicaId: musica_id, tom });
      res.status(201).json(result || { ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async removerSetlist(req, res) {
    try {
      await repo.removerSetlist(req.params.itemId);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listarMensagens(req, res) {
    try {
      const result = await repo.listarMensagens(req.params.escalaId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async criarMensagem(req, res) {
    try {
      const { usuario_id, texto } = req.body;
      if (!texto?.trim()) return res.status(400).json({ error: 'Texto obrigatorio.' });
      const result = await repo.criarMensagem({ escalaId: req.params.escalaId, usuarioId: usuario_id, texto: texto.trim() });
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async aprovarSubstituicao(req, res) {
    try {
      const { substituto_id } = req.body;
      if (!substituto_id) throw { status: 400, message: 'substituto_id obrigatorio.' };

      const pedido = await repo.buscarSubstituicaoComDetalhes(req.params.id);
      if (!pedido) throw { status: 404, message: 'Pedido nao encontrado.' };

      // remover solicitante da escala
      await repo.removerMembro({ escalaId: pedido.escala_id, usuarioId: pedido.solicitante_id });
      // adicionar substituto com a mesma funcao
      await repo.adicionarMembro({ escalaId: pedido.escala_id, usuarioId: substituto_id, funcaoId: pedido.funcao_solicitante });
      // marcar pedido como aprovado
      const resultado = await repo.atualizarSubstituicao({ id: req.params.id, status: 'aprovado' });
      res.json(resultado);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new EscalasController();
