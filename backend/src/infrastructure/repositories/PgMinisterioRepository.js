const pool = require('../database/pool');

const gerarCodigo = (nome) =>
  `${nome.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

class PgMinisterioRepository {
  async criar({ nome, icone, lider_id }) {
    const codigo = gerarCodigo(nome);
    const { rows } = await pool.query(
      'INSERT INTO ministerios (nome, icone, codigo_acesso, lider_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, icone, codigo, lider_id]
    );
    await pool.query(
      'INSERT INTO membros_ministerio (usuario_id, ministerio_id, permissao) VALUES ($1, $2, $3)',
      [lider_id, rows[0].id, 'admin']
    );
    return rows[0];
  }

  async buscarPorCodigo(codigo) {
    const { rows } = await pool.query('SELECT * FROM ministerios WHERE codigo_acesso = $1', [codigo]);
    return rows[0] || null;
  }

  async adicionarMembro(usuarioId, ministerioId) {
    await pool.query(
      'INSERT INTO membros_ministerio (usuario_id, ministerio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [usuarioId, ministerioId]
    );
  }

  async buscarMembros(ministerioId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.nome, u.foto_url, mm.permissao, mm.funcao_personalizada
       FROM membros_ministerio mm
       JOIN usuarios u ON mm.usuario_id = u.id
       WHERE mm.ministerio_id = $1`,
      [ministerioId]
    );
    return rows;
  }

  async buscarPorUsuario(usuarioId) {
    const { rows } = await pool.query(
      `SELECT m.* FROM ministerios m
       LEFT JOIN membros_ministerio mm ON m.id = mm.ministerio_id
       WHERE m.lider_id = $1 OR mm.usuario_id = $1
       GROUP BY m.id`,
      [usuarioId]
    );
    return rows;
  }
}

module.exports = PgMinisterioRepository;
