require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./src/infrastructure/database/pool');

const EMAILS_TESTE = [
  'ana@teste.com',
  'carlos@teste.com',
  'fernanda@teste.com',
  'rafael@teste.com',
  'julia@teste.com',
  'pedro@teste.com',
  'mariana@teste.com',
];

async function cleanup() {
  const { rows } = await pool.query(
    'SELECT id, nome, email FROM usuarios WHERE email = ANY($1)',
    [EMAILS_TESTE]
  );

  if (rows.length === 0) {
    console.log('Nenhum usuario de teste encontrado.');
    process.exit(0);
  }

  for (const u of rows) {
    console.log(`Removendo: ${u.nome} (${u.email})`);
  }

  const ids = rows.map((u) => u.id);
  await pool.query('DELETE FROM usuarios WHERE id = ANY($1)', [ids]);

  console.log(`\n${rows.length} usuarios removidos. Banco limpo.`);
  process.exit(0);
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});
