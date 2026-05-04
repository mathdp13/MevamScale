const pool = require('../database/pool');
const Usuario = require('../../domain/entities/Usuario');

class PgUsuarioRepository {
  async buscarPorEmail(email) {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return rows[0] ? new Usuario(rows[0]) : null;
  }

  async buscarPorId(id) {
    const { rows } = await pool.query(
      'SELECT id, nome, email, foto_url, telefone, data_nascimento, onboarding_done, permissao FROM usuarios WHERE id = $1',
      [id]
    );
    return rows[0] ? new Usuario(rows[0]) : null;
  }

  async criar({ nome, email, senha, google_id }) {
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, google_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, email, senha || null, google_id || null]
    );
    return new Usuario(rows[0]);
  }

  async atualizar(id, { nome, foto_url, telefone, data_nascimento }) {
    await pool.query(
      `UPDATE usuarios SET nome = $1, foto_url = $2, telefone = $3, data_nascimento = NULLIF($4, '')::DATE WHERE id = $5`,
      [nome, foto_url, telefone, data_nascimento, id]
    );
  }

  async atualizarSkills(usuarioId, funcoes) {
    await pool.query('DELETE FROM skill_usuarios WHERE usuario_id = $1', [usuarioId]);
    await Promise.all(
      funcoes.map((f) => pool.query('INSERT INTO skill_usuarios (usuario_id, funcao) VALUES ($1, $2)', [usuarioId, f]))
    );
    await pool.query('UPDATE usuarios SET onboarding_done = TRUE WHERE id = $1', [usuarioId]);
  }
}

module.exports = PgUsuarioRepository;
