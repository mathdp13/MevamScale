const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_usuarios (
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        funcao VARCHAR(50), -- Ex: 'Violão', 'Baixo', 'Mesa de som', 'Projeção'
        PRIMARY KEY (usuario_id, funcao)
        )
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

    // tabela de bandas/equipe

await pool.query(`
  CREATE TABLE IF NOT EXISTS bandas(
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
    nome_banda VARCHAR(100) NOT NULL
    );
  `);

// membros da banda/equipe

await pool.query(`
   CREATE TABLE IF NOT EXISTS membros_banda (
    banda_id INTEGER REFERENCES bandas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    funcao_na_banda VARCHAR (50),
    PRIMARY KEY (banda_id, usuario_id)
    );
  `);

    console.log("✅ Banco de Dados: Tabela de usuários e estrutura Multi-Projeto prontas!");
  } catch (err) {
    console.error("❌ Erro ao configurar o banco:", err.message);
  }
};

//executa as configs do banco ao ligar o servidor
setupDatabase();

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

    // 2. Compara a senha
    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Senha incorreta!" });
    }

    // 3. Gera o Token (o "crachá")
    const token = jwt.sign(
      { id: usuario.rows[0].id, permissao: usuario.rows[0].permissao },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. Retorna o Token + Dados do Usuário
    res.json({
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: usuario.rows[0].id,
        nome: usuario.rows[0].nome,
        permissao: usuario.rows[0].permissao
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/usuarios/skill', async (req, res) => {
  const { usuario_id, funcoes } = req.body; // funcoes deve ser um array: ["Violão", "Som"]

  try {
    // Limpa o que tinha antes para não dupar
    await pool.query("DELETE FROM skill_usuarios WHERE usuario_id = $1", [usuario_id]);

    const promessas = funcoes.map(f =>
      pool.query(
        "INSERT INTO skill_usuarios (usuario_id, funcao) VALUES ($1, $2)",
        [usuario_id, f] // 'f'
      )
    );

    await Promise.all(promessas);

    res.json({ message: "Perfil de habilidades atualizado!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
app.post('/escalas', autenticarToken,async (req, res) => {
  // 1. Chaves adicionadas aqui
  const { projeto_id, usuario_id, data_evento, funcao_escalada } = req.body;

  try {
    const novaEscala = await pool.query(
      `INSERT INTO escalas (projeto_id, usuario_id, data_evento, funcao_escalada) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [projeto_id, usuario_id, data_evento, funcao_escalada]
    );

    res.status(201).json({
      message: "Nova escala criada com sucesso!",
      escala: novaEscala.rows[0]
    });
  } catch(err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao criar escala: " + err.message });
  } 
}); 

app.post('/bandas', async (req, res) => {
  const { projeto_id, nome_banda } = req.body;
  try {
    const novaBanda = await pool.query(
      "INSERT INTO bandas (projeto_id, nome_banda) VALUES ($1, $2) RETURNING *",
      [projeto_id, nome_banda]
    );
    res.json(novaBanda.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Adicionar um voluntário a uma banda específica
app.post('/bandas/membros', async (req, res) => {
  const { banda_id, usuario_id, funcao_na_banda } = req.body;
  try {
    await pool.query(
      "INSERT INTO membros_banda (banda_id, usuario_id, funcao_na_banda) VALUES ($1, $2, $3)",
      [banda_id, usuario_id, funcao_na_banda]
    );
    res.json({ message: "Membro adicionado à banda!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/escalas/banda', autenticarToken, async (req, res) => {
  const { banda_id, projeto_id, data_evento } = req.body;

  try {
    // 1. Busca todos os membros que fazem parte dessa banda específica
    const membros = await pool.query(
      "SELECT usuario_id, funcao_na_banda FROM membros_banda WHERE banda_id = $1",
      [banda_id]
    );

    // 2. Insere todo mundo na tabela de escalas de uma vez só
    const promessas = membros.rows.map(membro => {
      return pool.query(
        `INSERT INTO escalas (projeto_id, usuario_id, data_evento, funcao_escalada) 
         VALUES ($1, $2, $3, $4)`,
        [projeto_id, membro.usuario_id, data_evento, membro.funcao_na_banda]
      );
    });

    await Promise.all(promessas);

    res.status(201).json({ message: `Sucesso! ${membros.rows.length} voluntários escalados de uma vez.` });
  } catch (err) {
    res.status(500).json({ error: "Erro ao escalar banda: " + err.message });
  }
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
      `SELECT e.id, u.nome, e.data_evento, e.funcao_escalada, e.confirmado 
       FROM escalas e 
       JOIN usuarios u ON e.usuario_id = u.id 
       WHERE e.projeto_id = $1 ORDER BY e.data_evento`,
      [projeto_id]
    );
    res.json(escala.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// porta q vai ouvir as request
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor conversando com a porta!${PORT}`)
});