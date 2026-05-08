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

  async buscarPorId(id) {
    const { rows } = await pool.query('SELECT * FROM ministerios WHERE id = $1', [id]);
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
      `SELECT
         u.id,
         u.nome,
         u.foto_url,
         mm.permissao,
         COALESCE(
           json_agg(json_build_object('id', mf.id, 'nome', mf.nome)) FILTER (WHERE mf.id IS NOT NULL),
           '[]'
         ) AS funcoes
       FROM membros_ministerio mm
       JOIN usuarios u ON mm.usuario_id = u.id
       LEFT JOIN membro_ministerio_funcoes mmf ON mmf.usuario_id = u.id AND mmf.ministerio_id = mm.ministerio_id
       LEFT JOIN ministerio_funcoes mf ON mf.id = mmf.funcao_id
       WHERE mm.ministerio_id = $1
       GROUP BY u.id, u.nome, u.foto_url, mm.permissao`,
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

  // Funcoes do ministerio (definidas pelo admin)
  async criarFuncao({ ministerioId, nome }) {
    const { rows } = await pool.query(
      'INSERT INTO ministerio_funcoes (ministerio_id, nome) VALUES ($1, $2) RETURNING *',
      [ministerioId, nome]
    );
    return rows[0];
  }

  async listarFuncoes(ministerioId) {
    const { rows } = await pool.query(
      'SELECT * FROM ministerio_funcoes WHERE ministerio_id = $1 ORDER BY criado_em ASC',
      [ministerioId]
    );
    return rows;
  }

  async atualizarFuncao({ funcaoId, ministerioId, nome }) {
    const { rows } = await pool.query(
      'UPDATE ministerio_funcoes SET nome = $1 WHERE id = $2 AND ministerio_id = $3 RETURNING *',
      [nome, funcaoId, ministerioId]
    );
    if (!rows[0]) throw { status: 404, message: 'Funcao nao encontrada.' };
    return rows[0];
  }

  async deletarFuncao(funcaoId, ministerioId) {
    await pool.query(
      'DELETE FROM ministerio_funcoes WHERE id = $1 AND ministerio_id = $2',
      [funcaoId, ministerioId]
    );
  }

  // Funcoes do membro dentro do ministerio (onboarding)
  async salvarFuncoesMembro({ usuarioId, ministerioId, funcaoIds }) {
    await pool.query(
      'DELETE FROM membro_ministerio_funcoes WHERE usuario_id = $1 AND ministerio_id = $2',
      [usuarioId, ministerioId]
    );
    await Promise.all(
      funcaoIds.map((funcaoId) =>
        pool.query(
          'INSERT INTO membro_ministerio_funcoes (usuario_id, ministerio_id, funcao_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [usuarioId, ministerioId, funcaoId]
        )
      )
    );
  }

  async deletar(ministerioId) {
    await pool.query('DELETE FROM ministerios WHERE id = $1', [ministerioId]);
  }

  async buscarFuncoesMembro({ usuarioId, ministerioId }) {
    const { rows } = await pool.query(
      `SELECT mf.id, mf.nome
       FROM membro_ministerio_funcoes mmf
       JOIN ministerio_funcoes mf ON mf.id = mmf.funcao_id
       WHERE mmf.usuario_id = $1 AND mmf.ministerio_id = $2`,
      [usuarioId, ministerioId]
    );
    return rows;
  }
}

module.exports = PgMinisterioRepository;
