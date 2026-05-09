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
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS superadmin BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pode_slides BOOLEAN DEFAULT FALSE`,
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

    // Remove tabela escalas antiga (Fase 1 com projeto_id) se existir
    await pool.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'escalas' AND column_name = 'projeto_id'
        ) THEN
          DROP TABLE IF EXISTS escalas CASCADE;
        END IF;
      END $$;
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_culto (
        id SERIAL PRIMARY KEY,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS escalas (
        id SERIAL PRIMARY KEY,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        tipo_culto_id INTEGER REFERENCES tipos_culto(id) ON DELETE SET NULL,
        nome VARCHAR(150) NOT NULL,
        data_evento DATE NOT NULL,
        data_ensaio DATE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS escala_membros (
        id SERIAL PRIMARY KEY,
        escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        funcao_id INTEGER REFERENCES ministerio_funcoes(id) ON DELETE SET NULL,
        confirmado BOOLEAN DEFAULT FALSE,
        UNIQUE(escala_id, usuario_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos_ausencia (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        motivo TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, ministerio_id, data)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos_substituicao (
        id SERIAL PRIMARY KEY,
        escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
        solicitante_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
        motivo TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS slides_login (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        subtitulo TEXT,
        imagem_url TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS dia_limite_ausencias INTEGER`);

    await pool.query(`ALTER TABLE slides_login ADD COLUMN IF NOT EXISTS data_inicio DATE`);
    await pool.query(`ALTER TABLE slides_login ADD COLUMN IF NOT EXISTS data_fim DATE`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipo_culto_formacao (
        id SERIAL PRIMARY KEY,
        tipo_culto_id INTEGER REFERENCES tipos_culto(id) ON DELETE CASCADE,
        funcao_id INTEGER REFERENCES ministerio_funcoes(id) ON DELETE CASCADE,
        quantidade INTEGER NOT NULL DEFAULT 1,
        UNIQUE(tipo_culto_id, funcao_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS escala_config (
        id SERIAL PRIMARY KEY,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        data_limite_ausencias DATE,
        UNIQUE(ministerio_id, mes, ano)
      );
    `);

    console.log('Migrations concluidas');
  } catch (err) {
    console.error('Erro nas migrations:', err);
    throw err;
  }
};

module.exports = { run };
