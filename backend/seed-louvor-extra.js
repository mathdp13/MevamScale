require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./src/infrastructure/database/pool');
const bcrypt = require('bcrypt');

const SENHA = '123456';

// Usuarios extras com funcoes especificas
const EXTRAS = [
  { nome: 'Bruno Rocha',    email: 'bruno@teste.com',    funcao: 'Bateria' },
  { nome: 'Leticia Dias',   email: 'leticia@teste.com',  funcao: 'Bateria' },
  { nome: 'Camila Moura',   email: 'camila@teste.com',   funcao: 'Vocalista' },
  { nome: 'Diego Farias',   email: 'diego@teste.com',    funcao: 'Vocalista' },
  { nome: 'Thais Borges',   email: 'thais@teste.com',    funcao: 'Teclado' },
  { nome: 'Lucas Prado',    email: 'lucas@teste.com',    funcao: 'Teclado' },
  { nome: 'Renata Lopes',   email: 'renata@teste.com',   funcao: 'Lead' },
  { nome: 'Felipe Cunha',   email: 'felipe@teste.com',   funcao: 'Violao' },
];

async function seed() {
  const senhaHash = await bcrypt.hash(SENHA, 10);

  const { rows: mins } = await pool.query(
    "SELECT id, nome FROM ministerios WHERE LOWER(nome) LIKE '%louvor%' LIMIT 1"
  );
  if (mins.length === 0) { console.log('Ministerio Louvor nao encontrado.'); process.exit(1); }
  const ministerio = mins[0];
  console.log(`Ministerio: ${ministerio.nome} (id=${ministerio.id})`);

  const { rows: funcoes } = await pool.query(
    'SELECT id, nome FROM ministerio_funcoes WHERE ministerio_id = $1 ORDER BY id',
    [ministerio.id]
  );
  console.log(`Funcoes: ${funcoes.map((f) => f.nome).join(', ')}`);

  for (const u of EXTRAS) {
    let userId;
    const { rows: existing } = await pool.query('SELECT id FROM usuarios WHERE email = $1', [u.email]);
    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`  Ja existe: ${u.nome}`);
    } else {
      const { rows: criado } = await pool.query(
        'INSERT INTO usuarios (nome, email, senha, onboarding_done) VALUES ($1, $2, $3, TRUE) RETURNING id',
        [u.nome, u.email, senhaHash]
      );
      userId = criado[0].id;
      console.log(`  Criado: ${u.nome} (id=${userId})`);
    }

    await pool.query(
      'INSERT INTO membros_ministerio (usuario_id, ministerio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, ministerio.id]
    );

    // Busca funcao pelo nome (case-insensitive)
    const funcao = funcoes.find((f) => f.nome.toLowerCase() === u.funcao.toLowerCase());
    if (funcao) {
      await pool.query(
        `INSERT INTO membro_ministerio_funcoes (usuario_id, ministerio_id, funcao_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [userId, ministerio.id, funcao.id]
      );
      console.log(`    -> ${funcao.nome}`);
    } else {
      console.log(`    -> FUNCAO "${u.funcao}" NAO ENCONTRADA no ministerio`);
    }
  }

  console.log('\nSeed concluido! Senha: 123456');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
