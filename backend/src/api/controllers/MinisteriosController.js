const CriarMinisterioUseCase = require('../../application/usecases/ministerios/CriarMinisterioUseCase');
const EntrarMinisterioUseCase = require('../../application/usecases/ministerios/EntrarMinisterioUseCase');
const BuscarMembrosUseCase = require('../../application/usecases/ministerios/BuscarMembrosUseCase');
const BuscarMinisterioUseCase = require('../../application/usecases/ministerios/BuscarMinisterioUseCase');
const CriarFuncaoUseCase = require('../../application/usecases/ministerios/CriarFuncaoUseCase');
const ListarFuncoesUseCase = require('../../application/usecases/ministerios/ListarFuncoesUseCase');
const DeletarFuncaoUseCase = require('../../application/usecases/ministerios/DeletarFuncaoUseCase');
const SalvarFuncoesMembroUseCase = require('../../application/usecases/ministerios/SalvarFuncoesMembroUseCase');
const DeletarMinisterioUseCase = require('../../application/usecases/ministerios/DeletarMinisterioUseCase');
const AtualizarFuncaoUseCase = require('../../application/usecases/ministerios/AtualizarFuncaoUseCase');
const AtualizarMinisterioUseCase = require('../../application/usecases/ministerios/AtualizarMinisterioUseCase');
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

  async atualizarFuncao(req, res) {
    try {
      const result = await new AtualizarFuncaoUseCase(ministerioRepo).execute({
        funcaoId: req.params.funcaoId,
        ministerioId: req.params.id,
        nome: req.body.nome,
      });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
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

  async atualizar(req, res) {
    try {
      const { nome, dia_limite_ausencias } = req.body;
      let result;
      if (nome !== undefined) {
        result = await new AtualizarMinisterioUseCase(ministerioRepo).execute({
          ministerioId: req.params.id,
          nome,
        });
      }
      if (dia_limite_ausencias !== undefined) {
        result = await ministerioRepo.atualizarDiaLimite({
          ministerioId: req.params.id,
          dia: dia_limite_ausencias ? Number(dia_limite_ausencias) : null,
        });
      }
      res.json(result || { ok: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
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

  async getEscalaConfig(req, res) {
    try {
      const result = await ministerioRepo.getEscalaConfig({
        ministerioId: req.params.id,
        mes: req.query.mes,
        ano: req.query.ano,
      });
      res.json(result || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async setEscalaConfig(req, res) {
    try {
      const result = await ministerioRepo.setEscalaConfig({
        ministerioId: req.params.id,
        mes: req.body.mes,
        ano: req.body.ano,
        dataLimiteAusencias: req.body.data_limite_ausencias || null,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new MinisteriosController();
