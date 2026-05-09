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
      `SELECT tc.*,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT('funcao_id', tcf.funcao_id, 'quantidade', tcf.quantidade, 'funcao_nome', mf.nome))
          FILTER (WHERE tcf.id IS NOT NULL), '[]'
        ) AS formacao
       FROM tipos_culto tc
       LEFT JOIN tipo_culto_formacao tcf ON tcf.tipo_culto_id = tc.id
       LEFT JOIN ministerio_funcoes mf ON mf.id = tcf.funcao_id
       WHERE tc.ministerio_id = $1
       GROUP BY tc.id
       ORDER BY tc.criado_em ASC`,
      [ministerioId]
    );
    return rows;
  }

  async salvarFormacaoItem({ tipoCultoId, funcaoId, quantidade }) {
    const { rows } = await pool.query(
      `INSERT INTO tipo_culto_formacao (tipo_culto_id, funcao_id, quantidade)
       VALUES ($1, $2, $3)
       ON CONFLICT (tipo_culto_id, funcao_id) DO UPDATE SET quantidade = $3
       RETURNING *`,
      [tipoCultoId, funcaoId, quantidade]
    );
    return rows[0];
  }

  async removerFormacaoItem({ tipoCultoId, funcaoId }) {
    await pool.query(
      'DELETE FROM tipo_culto_formacao WHERE tipo_culto_id = $1 AND funcao_id = $2',
      [tipoCultoId, funcaoId]
    );
  }

  async buscarLineupCompleto(ministerioId) {
    const { rows } = await pool.query(
      `SELECT mmf.usuario_id, mmf.funcao_id
       FROM membro_ministerio_funcoes mmf
       WHERE mmf.ministerio_id = $1
       ORDER BY mmf.usuario_id ASC`,
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

  async listarAgendaGeral({ mes, ano, ministerioId }) {
    const { rows } = await pool.query(
      `SELECT
        e.id, e.nome, e.data_evento, e.data_ensaio,
        m.id AS ministerio_id, m.nome AS ministerio_nome,
        COUNT(em.id)::int AS total_membros,
        JSON_AGG(
          JSON_BUILD_OBJECT('nome', u.nome, 'funcao', mf.nome, 'confirmado', em.confirmado)
          ORDER BY u.nome
        ) FILTER (WHERE u.id IS NOT NULL) AS membros
       FROM escalas e
       JOIN ministerios m ON m.id = e.ministerio_id
       LEFT JOIN escala_membros em ON em.escala_id = e.id
       LEFT JOIN usuarios u ON u.id = em.usuario_id
       LEFT JOIN ministerio_funcoes mf ON mf.id = em.funcao_id
       WHERE EXTRACT(MONTH FROM e.data_evento) = $1
         AND EXTRACT(YEAR FROM e.data_evento) = $2
         AND ($3::int IS NULL OR e.ministerio_id = $3)
       GROUP BY e.id, m.id, m.nome
       ORDER BY e.data_evento ASC`,
      [mes, ano, ministerioId || null]
    );
    return rows;
  }

  async buscarLineupMinisterio(ministerioId) {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (mmf.usuario_id) mmf.usuario_id, mmf.funcao_id
       FROM membro_ministerio_funcoes mmf
       WHERE mmf.ministerio_id = $1
       ORDER BY mmf.usuario_id, mmf.funcao_id`,
      [ministerioId]
    );
    return rows;
  }

  // ---------- Ausencias ----------

  async criarAusencia({ usuarioId, ministerioId, data, motivo }) {
    const { rows } = await pool.query(
      `INSERT INTO pedidos_ausencia (usuario_id, ministerio_id, data, motivo)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, ministerio_id, data) DO UPDATE SET motivo = $4
       RETURNING *`,
      [usuarioId, ministerioId, data, motivo || null]
    );
    return rows[0];
  }

  async listarAusencias({ ministerioId, mes, ano }) {
    const { rows } = await pool.query(
      `SELECT pa.*, u.nome AS usuario_nome
       FROM pedidos_ausencia pa
       JOIN usuarios u ON u.id = pa.usuario_id
       WHERE pa.ministerio_id = $1
         AND EXTRACT(MONTH FROM pa.data) = $2
         AND EXTRACT(YEAR FROM pa.data) = $3
       ORDER BY pa.data ASC`,
      [ministerioId, mes, ano]
    );
    return rows;
  }

  async deletarAusencia({ id, usuarioId }) {
    await pool.query(
      'DELETE FROM pedidos_ausencia WHERE id = $1 AND usuario_id = $2',
      [id, usuarioId]
    );
  }

  // ---------- Substituicoes ----------

  async criarSubstituicao({ escalaId, solicitanteId, motivo }) {
    const { rows } = await pool.query(
      `INSERT INTO pedidos_substituicao (escala_id, solicitante_id, motivo)
       VALUES ($1, $2, $3) RETURNING *`,
      [escalaId, solicitanteId, motivo || null]
    );
    return rows[0];
  }

  async listarSubstituicoes({ ministerioId, status }) {
    const { rows } = await pool.query(
      `SELECT ps.*, e.nome AS escala_nome, e.data_evento,
         u.nome AS solicitante_nome,
         m.nome AS ministerio_nome
       FROM pedidos_substituicao ps
       JOIN escalas e ON e.id = ps.escala_id
       JOIN ministerios m ON m.id = e.ministerio_id
       JOIN usuarios u ON u.id = ps.solicitante_id
       WHERE e.ministerio_id = $1
         AND ($2::text IS NULL OR ps.status = $2)
       ORDER BY ps.criado_em DESC`,
      [ministerioId, status || null]
    );
    return rows;
  }

  async atualizarSubstituicao({ id, status }) {
    const { rows } = await pool.query(
      'UPDATE pedidos_substituicao SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  }

  async listarStats({ ministerioId }) {
    const { rows } = await pool.query(
      `SELECT u.id, u.nome, u.foto_url,
        COUNT(em.id)::int AS total_participacoes,
        COUNT(em.id) FILTER (WHERE em.confirmado = true)::int AS total_confirmados
       FROM membros_ministerio mm
       JOIN usuarios u ON u.id = mm.usuario_id
       LEFT JOIN escala_membros em ON em.usuario_id = u.id
       LEFT JOIN escalas e ON e.id = em.escala_id AND e.ministerio_id = $1
       WHERE mm.ministerio_id = $1
       GROUP BY u.id, u.nome, u.foto_url
       ORDER BY total_participacoes DESC`,
      [ministerioId]
    );
    return rows;
  }

  async listarAgenda({ usuarioId, mes, ano }) {
    const { rows } = await pool.query(
      `SELECT
        e.id, e.nome, e.data_evento, e.data_ensaio,
        em.confirmado,
        mf.nome AS funcao_nome,
        m.id AS ministerio_id, m.nome AS ministerio_nome
       FROM escala_membros em
       JOIN escalas e ON e.id = em.escala_id
       JOIN ministerios m ON m.id = e.ministerio_id
       LEFT JOIN ministerio_funcoes mf ON mf.id = em.funcao_id
       WHERE em.usuario_id = $1
         AND EXTRACT(MONTH FROM e.data_evento) = $2
         AND EXTRACT(YEAR FROM e.data_evento) = $3
       ORDER BY e.data_evento ASC`,
      [usuarioId, mes, ano]
    );
    return rows;
  }
}

module.exports = PgEscalaRepository;
