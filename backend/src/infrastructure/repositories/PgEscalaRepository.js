const pool = require('../database/pool');

class PgEscalaRepository {
  // ---------- Tipos de culto ----------

  async criarTipoCulto({ ministerioId, nome, diaSemana }) {
    const { rows } = await pool.query(
      'INSERT INTO tipos_culto (ministerio_id, nome, dia_semana) VALUES ($1, $2, $3) RETURNING *',
      [ministerioId, nome, diaSemana ?? null]
    );
    return rows[0];
  }

  async listarTiposCulto(ministerioId) {
    const { rows } = await pool.query(
      'SELECT * FROM tipos_culto WHERE ministerio_id = $1 ORDER BY criado_em ASC',
      [ministerioId]
    );
    return rows;
  }

  async deletarTipoCulto(id) {
    await pool.query('DELETE FROM tipos_culto WHERE id = $1', [id]);
  }

  // ---------- Escalas ----------

  async criarEscala({ ministerioId, tipoCultoId, nome, dataEvento, dataEnsaio }) {
    const { rows } = await pool.query(
      `INSERT INTO escalas (ministerio_id, tipo_culto_id, nome, data_evento, data_ensaio)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ministerioId, tipoCultoId || null, nome, dataEvento, dataEnsaio || null]
    );
    return rows[0];
  }

  async listarEscalas({ ministerioId, mes, ano }) {
    const { rows } = await pool.query(
      `SELECT e.*, tc.nome AS tipo_culto_nome,
        COUNT(em.id)::int AS total_membros
       FROM escalas e
       LEFT JOIN tipos_culto tc ON tc.id = e.tipo_culto_id
       LEFT JOIN escala_membros em ON em.escala_id = e.id
       WHERE e.ministerio_id = $1
         AND EXTRACT(MONTH FROM e.data_evento) = $2
         AND EXTRACT(YEAR FROM e.data_evento) = $3
       GROUP BY e.id, tc.nome
       ORDER BY e.data_evento ASC`,
      [ministerioId, mes, ano]
    );
    return rows;
  }

  async buscarEscala(id) {
    const { rows } = await pool.query(
      `SELECT e.*, tc.nome AS tipo_culto_nome FROM escalas e
       LEFT JOIN tipos_culto tc ON tc.id = e.tipo_culto_id
       WHERE e.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async deletarEscala(id) {
    await pool.query('DELETE FROM escalas WHERE id = $1', [id]);
  }

  async escalaExiste({ ministerioId, dataEvento, tipoCultoId }) {
    const { rows } = await pool.query(
      'SELECT id FROM escalas WHERE ministerio_id = $1 AND data_evento = $2 AND tipo_culto_id = $3',
      [ministerioId, dataEvento, tipoCultoId]
    );
    return rows.length > 0;
  }

  // ---------- Membros da escala ----------

  async listarMembros(escalaId) {
    const { rows } = await pool.query(
      `SELECT em.id, em.confirmado, em.funcao_id,
        u.id AS usuario_id, u.nome, u.foto_url,
        mf.nome AS funcao_nome
       FROM escala_membros em
       JOIN usuarios u ON u.id = em.usuario_id
       LEFT JOIN ministerio_funcoes mf ON mf.id = em.funcao_id
       WHERE em.escala_id = $1
       ORDER BY u.nome ASC`,
      [escalaId]
    );
    return rows;
  }

  async adicionarMembro({ escalaId, usuarioId, funcaoId }) {
    const { rows } = await pool.query(
      `INSERT INTO escala_membros (escala_id, usuario_id, funcao_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (escala_id, usuario_id) DO UPDATE SET funcao_id = $3
       RETURNING *`,
      [escalaId, usuarioId, funcaoId || null]
    );
    return rows[0];
  }

  async removerMembro({ escalaId, usuarioId }) {
    await pool.query(
      'DELETE FROM escala_membros WHERE escala_id = $1 AND usuario_id = $2',
      [escalaId, usuarioId]
    );
  }

  async confirmarPresenca({ escalaId, usuarioId, confirmado }) {
    await pool.query(
      'UPDATE escala_membros SET confirmado = $1 WHERE escala_id = $2 AND usuario_id = $3',
      [confirmado, escalaId, usuarioId]
    );
  }
}

module.exports = PgEscalaRepository;
