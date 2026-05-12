require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./src/infrastructure/database/pool');

async function run() {
  const { rows: u } = await pool.query("SELECT id FROM usuarios WHERE email = 'felipe@teste.com'");
  const { rows: f } = await pool.query("SELECT id FROM ministerio_funcoes WHERE ministerio_id = 10 AND nome ILIKE 'Viol%'");
  await pool.query(
    'INSERT INTO membro_ministerio_funcoes (usuario_id, ministerio_id, funcao_id) VALUES ($1, 10, $2) ON CONFLICT DO NOTHING',
    [u[0].id, f[0].id]
  );
  console.log(`Felipe (id=${u[0].id}) -> ${f[0].id} (Violao) ok`);
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
