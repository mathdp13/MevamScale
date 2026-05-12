const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../../infrastructure/database/pool');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const HEADERS_BASE = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

const HEADERS_SEARCH = {
  ...HEADERS_BASE,
  'Referer': 'https://www.cifraclub.com.br/',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

async function getSessionCookies() {
  try {
    const res = await axios.get('https://www.cifraclub.com.br/', {
      headers: HEADERS_BASE,
      timeout: 8000,
      maxRedirects: 5,
    });
    const setCookies = res.headers['set-cookie'] || [];
    return setCookies.map(c => c.split(';')[0]).join('; ');
  } catch {
    return '';
  }
}

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function ehLinkCifra(href) {
  if (!href) return false;
  if (href.includes('/letra/') || href.includes('/imprimir/') || href.includes('/tab/')) return false;
  return /^(?:https?:\/\/(?:www\.)?cifraclub\.com\.br)?\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(href);
}

class CifraController {
  async buscar(req, res) {
    try {
      const { nome, artista } = req.query;
      if (!nome) return res.status(400).json({ error: 'nome obrigatorio' });

      // Passo 1: Cache no banco
      const params = artista ? [nome, artista] : [nome, ''];
      const cache = await pool.query(
        `SELECT link_cifra FROM musicas
         WHERE nome ILIKE $1 AND (artista ILIKE $2 OR $2 = '') AND link_cifra IS NOT NULL
         LIMIT 1`,
        params
      );
      if (cache.rows[0]?.link_cifra) {
        console.log('[CifraController] Cache hit:', cache.rows[0].link_cifra);
        return res.json({ url: cache.rows[0].link_cifra, fonte: 'cache' });
      }

      // Obter cookies da sessão do Cifra Club
      const cookies = await getSessionCookies();
      console.log('[CifraController] Cookies obtidos:', cookies ? 'sim' : 'nenhum');
      const headers = cookies
        ? { ...HEADERS_SEARCH, Cookie: cookies }
        : HEADERS_SEARCH;

      // Passo 2: Slug + HEAD
      if (artista) {
        const slugArtista = toSlug(artista);
        const slugNome = toSlug(nome);
        if (slugArtista === 'undefined' || slugNome === 'undefined' || !slugArtista || !slugNome) {
          return res.json({ url: null, fonte: 'nao_encontrada' });
        }
        const urlTentativa = `https://www.cifraclub.com.br/${slugArtista}/${slugNome}/`;
        console.log('[CifraController] Tentando slug:', urlTentativa);
        try {
          const head = await axios.head(urlTentativa, {
            timeout: 5000,
            headers,
            maxRedirects: 0,
            validateStatus: (s) => s < 400,
          });
          if (head.status === 200) {
            console.log('[CifraController] Slug válido:', urlTentativa);
            return res.json({ url: urlTentativa, fonte: 'slug' });
          }
          // 3xx = redirect para busca = URL não existe, vai pro scraping
        } catch { /* erro de rede -> vai pro scraping */ }
      }

      // Passo 3: Scraping da busca do Cifra Club
      const q = encodeURIComponent(artista ? `${nome} ${artista}` : nome);
      const searchUrl = `https://www.cifraclub.com.br/?q=${q}`;
      console.log('[CifraController] Scraping:', searchUrl);
      const searchRes = await axios.get(searchUrl, { timeout: 10000, headers });

      const $ = cheerio.load(searchRes.data);
      let urlEncontrada = null;

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!ehLinkCifra(href)) return;
        const match = href.match(/\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
        if (!match) return;
        urlEncontrada = `https://www.cifraclub.com.br/${match[1]}/${match[2]}/`;
        return false;
      });

      if (urlEncontrada && !urlEncontrada.includes('/undefined/')) {
        console.log('[CifraController] Scraping encontrou:', urlEncontrada);
        return res.json({ url: urlEncontrada, fonte: 'scraping' });
      }

      console.log('[CifraController] Nao encontrada:', nome, artista);
      return res.json({ url: null, fonte: 'nao_encontrada' });
    } catch (err) {
      console.error('[CifraController]', err.message);
      return res.status(500).json({ url: null, fonte: 'erro', aviso: err.message });
    }
  }
}

module.exports = new CifraController();
