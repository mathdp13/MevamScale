const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');

const app = express();

//middlewares
app.use(cors());
app.use(express.json());

//1. função preparatoria para o DB
const setupDatabase = async () => {
  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        permissao VARCHAR(20) CHECK (permissao IN ('admin', 'som', 'projecao', 'louvor', 'voluntario')) DEFAULT 'voluntario'
      );
    `);

    // 2. Tabela de Projetos (Ex: Mevam Santana, Diaconia)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projetos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE
      );
    `);

    // 3. Tabela de Vínculo (Onde mora a permissão específica de cada projeto)
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

    console.log("✅ Banco de Dados: Tabela de usuários e estrutura Multi-Projeto prontas!");
  } catch (err) {
    console.error("❌ Erro ao configurar o banco:", err.message);
  }
};

//executa as configs do banco ao ligar o servidor
setupDatabase();

app.get('/', (req, res) => {
    res.send("API do MevamScale rodando com sucesso!")
});

app.post('/usuarios', async (req, res) => {
  const { nome, email, senha } = req.body;

  try {

    const saltRounds = 10;
    
    // Cria o hash da senha
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

    // Salva no banco a senha já escondida
    const novoUsuario = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, senhaCriptografada]
    );

    res.status(201).json(novoUsuario.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

app.post('/projetos', async (req, res) => {
  const { nome, usuario_id } = req.body;

  try {
    // 1. Cria o projeto
    const novoProjeto = await pool.query(
      "INSERT INTO projetos (nome) VALUES ($1) RETURNING *",
      [nome]
    );

    const projetoId = novoProjeto.rows[0].id;

    // 2. Vincula automaticamente quem criou como admin de tudo naquele projeto
    await pool.query(
      `INSERT INTO membros_projeto (usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao) 
       VALUES ($1, $2, 'admin', 'admin', 'admin')`,
      [usuario_id, projetoId]
    );

    res.status(201).json({
      message: "Projeto criado e você pode começar a editar suas escalas!",
      projeto: novoProjeto.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao criar projeto ou nome já em uso." });
  }
});

app.post('/vincular-membro', async (req, res) => {
  const { usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao } = req.body;

  try {
    await pool.query(
      `INSERT INTO membros_projeto (usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao) 
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario_id, projeto_id, cargo_louvor, cargo_som, cargo_projecao]
    );
    res.json({ message: "Usuário vinculado ao projeto com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao vincular: " + err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Busca o usuário pelo email
    const usuario = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

    if (usuario.rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado!" });
    }

    // 2. Compara a senha digitada com o Hash que está no banco
    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Senha incorreta!" });
    }

    // 3. Se deu tudo certo
    res.json({
      message: "Login realizado com sucesso!",
      user: {
        id: usuario.rows[0].id,
        nome: usuario.rows[0].nome,
        email: usuario.rows[0].email
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// porta q vai ouvir as request
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor conversando com a porta!${PORT}`)
});