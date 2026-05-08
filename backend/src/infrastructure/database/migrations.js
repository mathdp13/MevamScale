const pool = require('./pool');

const run = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255),
        permissao VARCHAR(20) CHECK (permissao IN ('admin', 'som', 'projecao', 'louvor', 'voluntario')) DEFAULT 'voluntario',
        onboarding_done BOOLEAN DEFAULT FALSE,
        google_id VARCHAR(255),
        foto_url TEXT,
        telefone VARCHAR(20),
        data_nascimento DATE
      );
    `);

    const alteracoesUsuarios = [
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`,
      `ALTER TABLE usuarios ALTER COLUMN senha DROP NOT NULL`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_nascimento DATE`,
    ];
    for (const sql of alteracoesUsuarios) await pool.query(sql);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ministerios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        icone VARCHAR(50),
        categoria VARCHAR(50) DEFAULT 'Geral',
        codigo_acesso VARCHAR(10) UNIQUE NOT NULL,
        lider_id INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'Geral'`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ministerio_funcoes (
        id SERIAL PRIMARY KEY,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        emoji VARCHAR(10),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membros_ministerio (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        funcao_personalizada VARCHAR(50),
        funcao_id INTEGER REFERENCES ministerio_funcoes(id) ON DELETE SET NULL,
        permissao VARCHAR(20) DEFAULT 'voluntario',
        UNIQUE(usuario_id, ministerio_id)
      );
    `);
    await pool.query(`ALTER TABLE membros_ministerio ADD COLUMN IF NOT EXISTS funcao_id INTEGER REFERENCES ministerio_funcoes(id) ON DELETE SET NULL`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_usuarios (
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        funcao VARCHAR(50),
        PRIMARY KEY (usuario_id, funcao)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projetos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membros_projeto (
        usuario_id INTEGER REFERENCES usuarios(id),
        projeto_id INTEGER REFERENCES projetos(id),
        cargo_som VARCHAR(20) DEFAULT 'visualizar',
        cargo_louvor VARCHAR(20) DEFAULT 'visualizar',
        cargo_projecao VARCHAR(20) DEFAULT 'visualizar',
        PRIMARY KEY (usuario_id, projeto_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS escalas (
        id SERIAL PRIMARY KEY,
        projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        data_evento TIMESTAMP NOT NULL,
        funcao_escalada VARCHAR(50) NOT NULL,
        confirmado BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bandas (
        id SERIAL PRIMARY KEY,
        projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
        nome_banda VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membros_banda (
        banda_id INTEGER REFERENCES bandas(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        funcao_na_banda VARCHAR(50),
        PRIMARY KEY (banda_id, usuario_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membro_ministerio_funcoes (
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        funcao_id INTEGER REFERENCES ministerio_funcoes(id) ON DELETE CASCADE,
        PRIMARY KEY (usuario_id, ministerio_id, funcao_id)
      );
    `);

    console.log('Migrations concluidas');
  } catch (err) {
    console.error('Erro nas migrations:', err);
    throw err;
  }
};

module.exports = { run };
