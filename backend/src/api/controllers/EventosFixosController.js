const pool = require('../../infrastructure/database/pool');
const cloudinary = require('cloudinary').v2;

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'eventos-fixos', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

class EventosFixosController {
  async listar(req, res) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM eventos_fixos WHERE ativo = TRUE ORDER BY dia_semana ASC'
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Erro ao listar eventos fixos.' });
    }
  }

  async listarAdmin(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      const { rows } = await pool.query(
        'SELECT * FROM eventos_fixos ORDER BY dia_semana ASC'
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Erro ao listar eventos fixos.' });
    }
  }

  async criar(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      const { nome, dia_semana, horario } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome obrigatorio.' });

      let imagem_url = null;
      if (req.file) {
        imagem_url = await uploadToCloudinary(req.file.buffer);
      }

      const { rows } = await pool.query(
        `INSERT INTO eventos_fixos (nome, dia_semana, horario, imagem_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [nome, dia_semana ?? null, horario || null, imagem_url]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[EventosFixosController.criar]', err);
      res.status(500).json({ error: 'Erro ao criar evento.', detail: err.message });
    }
  }

  async toggleAtivo(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      const { rows } = await pool.query(
        'UPDATE eventos_fixos SET ativo = NOT ativo WHERE id = $1 RETURNING *',
        [req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Evento nao encontrado.' });
      res.json(rows[0]);
    } catch {
      res.status(500).json({ error: 'Erro ao atualizar evento.' });
    }
  }

  async deletar(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      await pool.query('DELETE FROM eventos_fixos WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Erro ao deletar evento.' });
    }
  }
}

module.exports = { controller: new EventosFixosController() };
