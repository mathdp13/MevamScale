const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// 1. FUNÇÃO AUXILIAR (Gerador de Código)
// ==========================================
const gerarCodigoAcesso = (nome) => {
  const prefixo = nome.substring(0, 3).toUpperCase();
  const sufixo = Math.floor(1000 + Math.random() * 9000);
  return `${prefixo}-${sufixo}`;
};

// ==========================================
// 2. CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
const setupDatabase = async () => {
  try {
    // Tabela de Usuários original
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255),
        permissao VARCHAR(20) CHECK (permissao IN ('admin', 'som', 'projecao', 'louvor', 'voluntario')) DEFAULT 'voluntario',
        onboarding_done BOOLEAN DEFAULT FALSE,
        google_id VARCHAR(255)
      );
    `);

    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE usuarios ALTER COLUMN senha DROP NOT NULL`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE`);

    // --- 🟢 INÍCIO DA ESTRUTURA NOVA (MINISTÉRIOS) ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ministerios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        icone VARCHAR(50), 
        codigo_acesso VARCHAR(10) UNIQUE NOT NULL,
        lider_id INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membros_ministerio (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,
        funcao_personalizada VARCHAR(50),
        permissao VARCHAR(20) DEFAULT 'voluntario',
        UNIQUE(usuario_id, ministerio_id)
      );
    `);
    // --- 🟢 FIM DA ESTRUTURA NOVA ---

    // Estruturas antigas (Projetos, Escalas, Bandas)!
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
      CREATE TABLE IF NOT EXISTS skill_usuarios (
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        funcao VARCHAR(50),
        PRIMARY KEY (usuario_id, funcao)
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
      CREATE TABLE IF NOT EXISTS bandas(
        id SERIAL PRIMARY KEY,
        projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
        nome_banda VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS membros_banda (
        banda_id INTEGER REFERENCES bandas(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        funcao_na_banda VARCHAR (50),
        PRIMARY KEY (banda_id, usuario_id)
      );
    `);

    console.log("✅ Banco de Dados: Tabelas antigas e ESTRUTURA NOVA DE MINISTÉRIOS prontas!");
  } catch (err) {
    console.error("❌ Erro ao configurar o banco:", err.message);
  }
};

setupDatabase();

// ==========================================
// 3. MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Acesso negado!" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido!" });
    req.user = user;
    next();
  });
};

// ==========================================
// 4. ROTAS DA API
// ==========================================

app.get('/', (req, res) => {
  res.send("API do MevamScale rodando com sucesso!")
});

// --- 🟢 INÍCIO DAS ROTAS NOVAS (MINISTÉRIOS E CÓDIGOS) ---

// Criar Ministério
app.post('/ministerios', async (req, res) => {
  const { nome, icone, lider_id } = req.body;
  const codigo = gerarCodigoAcesso(nome);

  try {
    const novo = await pool.query(
      'INSERT INTO ministerios (nome, icone, codigo_acesso, lider_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, icone, codigo, lider_id]
    );

    await pool.query(
      'INSERT INTO membros_ministerio (usuario_id, ministerio_id, permissao) VALUES ($1, $2, $3)',
      [lider_id, novo.rows[0].id, 'admin']
    );

    res.status(201).json(novo.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar ministério: " + err.message });
  }
});

// Entrar em um Ministério (O Voluntário usa o código aqui)
app.post('/ministerios/entrar', async (req, res) => {
  const { codigo, usuario_id } = req.body;

  try {
    const min = await pool.query('SELECT id FROM ministerios WHERE codigo_acesso = $1', [codigo]);

    if (min.rows.length === 0) {
      return res.status(404).json({ error: "Código inválido ou ministério não encontrado." });
    }

    const ministerioId = min.rows[0].id;

    await pool.query(
      'INSERT INTO membros_ministerio (usuario_id, ministerio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [usuario_id, ministerioId]
    );

    res.json({ message: "Você entrou no ministério!", ministerioId });
  } catch (err) {
    res.status(500).json({ error: "Erro ao entrar no ministério." });
  }
});

// --- 🟢 FIM DAS ROTAS NOVAS ---


// --- ROTAS ANTIGAS (MANTIDAS EXATAMENTE COMO VOCÊ FEZ) ---

app.post('/usuarios', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const saltRounds = 10;
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    const novoUsuario = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, senhaCriptografada]
    );
    res.status(201).json(novoUsuario.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

app.post('/projetos', async (req, res) => {
  const { nome, usuario_id } = req.body;
  try {
    const novoProjeto = await pool.query("INSERT INTO projetos (nome) VALUES ($1) RETURNING *", [nome]);
    const projetoId = novoProjeto.rows[0].id;
    await pool.query(
      `INSERT INTO membros_projeto (usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao) VALUES ($1, $2, 'admin', 'admin', 'admin')`,
      [usuario_id, projetoId]
    );
    res.status(201).json({ message: "Projeto criado!", projeto: novoProjeto.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar projeto." });
  }
});

app.post('/vincular-membro', async (req, res) => {
  const { usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao } = req.body;
  try {
    await pool.query(
      `INSERT INTO membros_projeto (usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao) VALUES ($1, $2, $3, $4, $5)`,
      [usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao]
    );
    res.json({ message: "Usuário vinculado ao projeto com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao vincular." });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (usuario.rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado!" });
    
    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta!" });

    const token = jwt.sign({ id: usuario.rows[0].id, permissao: usuario.rows[0].permissao }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      message: "Login realizado com sucesso!",
      token,
      user: { id: usuario.rows[0].id, nome: usuario.rows[0].nome, permissao: usuario.rows[0].permissao, onboardingDone: usuario.rows[0].onboarding_done }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;
    let usuario = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

    if (usuario.rows.length === 0) {
      const novo = await pool.query("INSERT INTO usuarios (nome, email, google_id, onboarding_done) VALUES ($1, $2, $3, FALSE) RETURNING *", [name, email, sub]);
      usuario = novo;
    }

    const tokenSistema = jwt.sign({ id: usuario.rows[0].id, permissao: usuario.rows[0].permissao }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      message: "Login via Google realizado!",
      token: tokenSistema,
      user: { id: usuario.rows[0].id, nome: usuario.rows[0].nome, permissao: usuario.rows[0].permissao, onboardingDone: usuario.rows[0].onboarding_done }
    });
  } catch (err) {
    res.status(401).json({ error: "Falha na autenticação com Google." });
  }
});

app.post('/usuarios/skill', async (req, res) => {
  const { usuario_id, funcoes } = req.body;
  try {
    await pool.query("DELETE FROM skill_usuarios WHERE usuario_id = $1", [usuario_id]);
    const promessas = funcoes.map(f => pool.query("INSERT INTO skill_usuarios (usuario_id, funcao) VALUES ($1, $2)", [usuario_id, f]));
    await Promise.all(promessas);
    res.json({ message: "Perfil atualizado!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put(`/usuarios/perfil`, async (req,res) => {
  const { instrumento, userId } = req.body;
  try {
    const result = await pool.query(
      `UPDATE usuarios SET instrumento = $1, onboarding_done = TRUE WHERE id = $2 RETURNING id, nome, instrumento, onboarding_done`,
      [instrumento, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario não encontrado!" });
    res.json({ message: "Perfil atualizado!", user: result.rows[0] });
  } catch (err){
    res.status(500).json({ error: "Erro ao salvar perfil!" });
  }
});
 
app.post('/escalas', autenticarToken,async (req, res) => {
  const { projeto_id, usuario_id, data_evento, funcao_escalada } = req.body;
  try {
    const novaEscala = await pool.query(
      `INSERT INTO escalas (projeto_id, usuario_id, data_evento, funcao_escalada) VALUES ($1, $2, $3, $4) RETURNING *`,
      [projeto_id, usuario_id, data_evento, funcao_escalada]
    );
    res.status(201).json({ message: "Nova escala criada!", escala: novaEscala.rows[0] });
  } catch(err) { res.status(500).json({ error: "Erro ao criar escala: " + err.message }); } 
}); 

app.post('/bandas', async (req, res) => {
  const { projeto_id, nome_banda } = req.body;
  try {
    const novaBanda = await pool.query("INSERT INTO bandas (projeto_id, nome_banda) VALUES ($1, $2) RETURNING *", [projeto_id, nome_banda]);
    res.json(novaBanda.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/bandas/membros', async (req, res) => {
  const { banda_id, usuario_id, funcao_na_banda } = req.body;
  try {
    await pool.query("INSERT INTO membros_banda (banda_id, usuario_id, funcao_na_banda) VALUES ($1, $2, $3)", [banda_id, usuario_id, funcao_na_banda]);
    res.json({ message: "Membro adicionado à banda!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/escalas/banda', autenticarToken,async (req, res) => {
  const { banda_id, projeto_id, data_evento } = req.body;
  try {
    const membros = await pool.query("SELECT usuario_id, funcao_na_banda FROM membros_banda WHERE banda_id = $1", [banda_id]);
    const promessas = membros.rows.map(membro => {
      return pool.query(`INSERT INTO escalas (projeto_id, usuario_id, data_evento, funcao_escalada) VALUES ($1, $2, $3, $4)`, [projeto_id, membro.usuario_id, data_evento, membro.funcao_na_banda]);
    });
    await Promise.all(promessas);
    res.status(201).json({ message: `Sucesso! ${membros.rows.length} voluntários escalados.` });
  } catch (err) { res.status(500).json({ error: "Erro ao escalar banda." }); }
});

app.patch('/escalas/:id/confirmar', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE escalas SET confirmado = TRUE WHERE id = $1", [id]);
    res.json({ message: "Presença confirmada!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/escalas/:projeto_id', async (req, res) => {
  const { projeto_id } = req.params;
  try {
    const escala = await pool.query(
      `SELECT e.id, u.nome, e.data_evento, e.funcao_escalada, e.confirmado FROM escalas e JOIN usuarios u ON e.usuario_id = u.id WHERE e.projeto_id = $1 ORDER BY e.data_evento`,
      [projeto_id]
    );
    res.json(escala.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 5. INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor conversando com a porta!${PORT}`)
});