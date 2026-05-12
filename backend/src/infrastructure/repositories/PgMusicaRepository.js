const pool = require('../database/pool');

class PgMusicaRepository {
  async listarMusicas(ministerioId) {
    const { rows } = await pool.query(
      'SELECT * FROM musicas WHERE ministerio_id = $1 ORDER BY nome ASC',
      [ministerioId]
    );
    return rows;
  }

  async criarMusica({ ministerioId, nome, artista, linkCifra }) {
    const { rows } = await pool.query(
      'INSERT INTO musicas (ministerio_id, nome, artista, link_cifra) VALUES ($1, $2, $3, $4) RETURNING *',
      [ministerioId, nome, artista || null, linkCifra || null]
    );
    return rows[0];
  }

  async deletarMusica(id) {
    await pool.query('DELETE FROM musicas WHERE id = $1', [id]);
  }
}

module.exports = PgMusicaRepository;
