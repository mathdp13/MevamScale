require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./src/infrastructure/database/pool');
const bcrypt = require('bcrypt');

const USUARIOS_TESTE = [
  { nome: 'Ana Lima', email: 'ana@teste.com' },
  { nome: 'Carlos Souza', email: 'carlos@teste.com' },
  { nome: 'Fernanda Costa', email: 'fernanda@teste.com' },
  { nome: 'Rafael Mendes', email: 'rafael@teste.com' },
  { nome: 'Julia Rocha', email: 'julia@teste.com' },
  { nome: 'Pedro Alves', email: 'pedro@teste.com' },
  { nome: 'Mariana Neves', email: 'mariana@teste.com' },
];

const SENHA = '123456';

async function seed() {
  const senhaHash = await bcrypt.hash(SENHA, 10);

  // Encontrar ministerio Louvor
  const { rows: mins } = await pool.query(
    "SELECT id, nome FROM ministerios WHERE LOWER(nome) LIKE '%louvor%' LIMIT 1"
  );
  if (mins.length === 0) {
    console.log('Ministerio Louvor nao encontrado. Verifique o nome.');
    process.exit(1);
  }
  const ministerio = mins[0];
  console.log(`Ministerio encontrado: ${ministerio.nome} (id=${ministerio.id})`);

  // Buscar funcoes do ministerio
  const { rows: funcoes } = await pool.query(
    'SELECT id, nome FROM ministerio_funcoes WHERE ministerio_id = $1 ORDER BY id',
    [ministerio.id]
  );
  console.log(`Funcoes disponiveis: ${funcoes.map((f) => f.nome).join(', ') || 'nenhuma'}`);

  for (let i = 0; i < USUARIOS_TESTE.length; i++) {
    const u = USUARIOS_TESTE[i];

    // Criar usuario (ignora se ja existe)
    let userId;
    const { rows: existing } = await pool.query('SELECT id FROM usuarios WHERE email = $1', [u.email]);
    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`  Usuario ja existe: ${u.nome} (id=${userId})`);
    } else {
      const { rows: criado } = await pool.query(
        'INSERT INTO usuarios (nome, email, senha, onboarding_done) VALUES ($1, $2, $3, TRUE) RETURNING id',
        [u.nome, u.email, senhaHash]
      );
      userId = criado[0].id;
      console.log(`  Criado: ${u.nome} (id=${userId})`);
    }

    // Adicionar ao ministerio (ignora se ja membro)
    await pool.query(
      'INSERT INTO membros_ministerio (usuario_id, ministerio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, ministerio.id]
    );

    // Atribuir funcao ciclicamente
    if (funcoes.length > 0) {
      const funcao = funcoes[i % funcoes.length];
      await pool.query(
        `INSERT INTO membro_ministerio_funcoes (usuario_id, ministerio_id, funcao_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [userId, ministerio.id, funcao.id]
      );
      console.log(`    -> Funcao: ${funcao.nome}`);
    }
  }

  console.log('\nSeed concluido!');
  console.log(`Senha de todos: ${SENHA}`);
  console.log('Emails:');
  USUARIOS_TESTE.forEach((u) => console.log(`  ${u.email}`));
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
