const pool = require('../../infrastructure/database/pool');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

class SlidesController {
  async listar(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM slides_login
         WHERE ativo = TRUE
           AND (data_inicio IS NULL OR data_inicio <= CURRENT_DATE)
           AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
         ORDER BY criado_em DESC`
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Erro ao listar slides.' });
    }
  }

  async listarAdmin(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      const { rows } = await pool.query(
        'SELECT * FROM slides_login ORDER BY criado_em DESC'
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Erro ao listar slides.' });
    }
  }

  async criar(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      const { titulo, subtitulo, data_inicio, data_fim } = req.body;
      if (!titulo) return res.status(400).json({ error: 'Titulo obrigatorio.' });

      let imagem_url = null;
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'slides_login', resource_type: 'image' },
              (err, result) => { if (err) reject(err); else resolve(result); }
            );
            stream.end(req.file.buffer);
          });
          imagem_url = result.secure_url;
        } catch (uploadErr) {
          console.error('[SlidesController.criar] Cloudinary upload falhou:', uploadErr.message);
          // slide criado sem imagem se Cloudinary nao estiver configurado
        }
      }

      const { rows } = await pool.query(
        `INSERT INTO slides_login (titulo, subtitulo, imagem_url, data_inicio, data_fim)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [titulo, subtitulo || null, imagem_url, data_inicio || null, data_fim || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[SlidesController.criar]', err);
      res.status(500).json({ error: 'Erro ao criar slide.', detail: err.message });
    }
  }

  async toggleAtivo(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      const { rows } = await pool.query(
        'UPDATE slides_login SET ativo = NOT ativo WHERE id = $1 RETURNING *',
        [req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Slide nao encontrado.' });
      res.json(rows[0]);
    } catch {
      res.status(500).json({ error: 'Erro ao atualizar slide.' });
    }
  }

  async deletar(req, res) {
    try {
      const user = req.user;
      if (!user?.superadmin && !user?.pode_slides) {
        return res.status(403).json({ error: 'Sem permissao.' });
      }
      await pool.query('DELETE FROM slides_login WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Erro ao deletar slide.' });
    }
  }
}

module.exports = { controller: new SlidesController(), upload };
