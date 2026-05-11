const router = require('express').Router();

const LIVROS = [
  { abbrev: 'sl', chapters: 150, nome: 'Salmos' },
  { abbrev: 'pv', chapters: 31, nome: 'Proverbios' },
  { abbrev: 'is', chapters: 66, nome: 'Isaias' },
  { abbrev: 'mt', chapters: 28, nome: 'Mateus' },
  { abbrev: 'jo', chapters: 21, nome: 'Joao' },
  { abbrev: 'lc', chapters: 24, nome: 'Lucas' },
  { abbrev: 'rm', chapters: 16, nome: 'Romanos' },
  { abbrev: '1co', chapters: 16, nome: '1 Corintios' },
  { abbrev: 'ef', chapters: 6, nome: 'Efesios' },
  { abbrev: 'fp', chapters: 4, nome: 'Filipenses' },
  { abbrev: 'hb', chapters: 13, nome: 'Hebreus' },
  { abbrev: 'tg', chapters: 5, nome: 'Tiago' },
  { abbrev: 'mc', chapters: 16, nome: 'Marcos' },
  { abbrev: 'gl', chapters: 6, nome: 'Galatas' },
  { abbrev: 'ap', chapters: 22, nome: 'Apocalipse' },
];

router.get('/versiculo-aleatorio', async (req, res) => {
  try {
    const token = process.env.BIBLIA_TOKEN;

    if (token) {
      const r = await fetch('https://www.abibliadigital.com.br/api/verses/nvi/random', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        return res.json({ texto: d.text, ref: `${d.book?.name} ${d.chapter}:${d.number}` });
      }
    }

    const livro = LIVROS[Math.floor(Math.random() * LIVROS.length)];
    const capitulo = Math.floor(Math.random() * livro.chapters) + 1;
    const response = await fetch(
      `https://www.abibliadigital.com.br/api/verses/nvi/${livro.abbrev}/${capitulo}`
    );
    if (!response.ok) return res.status(502).json({ error: 'API da Biblia indisponivel.' });
    const data = await response.json();
    const verses = data.verses;
    if (!verses || verses.length === 0) return res.status(502).json({ error: 'Sem versiculos.' });
    const verso = verses[Math.floor(Math.random() * verses.length)];
    res.json({ texto: verso.text, ref: `${livro.nome} ${capitulo}:${verso.number}` });
  } catch {
    res.status(502).json({ error: 'Erro ao buscar versiculo.' });
  }
});

module.exports = router;
