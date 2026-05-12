const { GoogleGenerativeAI } = require('@google/generative-ai');

class CifraController {
  async buscar(req, res) {
    const { nome, artista } = req.query;
    if (!nome) return res.status(400).json({ error: 'nome obrigatorio' });

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ url: null, fonte: 'sem_chave' });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{ googleSearch: {} }],
      });

      const termoBusca = artista ? `"${nome}" "${artista}"` : `"${nome}"`;

      const prompt = `Você é um extrator de URLs. Use a ferramenta de busca do Google para pesquisar o seguinte:
${termoBusca} cifra acordes site:cifraclub.com.br

OBJETIVO: Retornar a URL EXATA presente no resultado real da busca do Google.

REGRAS DE EXTRAÇÃO (OBRIGATÓRIAS):
1. PROIBIDO INVENTAR OU DEDUZIR URL. Sites como o Cifra Club removem caracteres com acento da URL (ex: a música "Tu és" vira "tu-s"). Você DEVE copiar a URL crua e real que o buscador retornou.
2. A URL tem que ser a página de cifra. Rejeite e ignore URLs que terminem com /letra/ ou /imprimir/.
3. Caso o Cifra Club não tenha a música, faça uma segunda busca genérica (${termoBusca} cifra violão) e extraia de outro site brasileiro.
4. Seu output deve ser APENAS a URL completa em formato de texto simples, sem aspas, sem formatação markdown e sem textos adicionais.
5. Se não encontrar nenhuma cifra, retorne APENAS a palavra: NAO_ENCONTRADA`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      if (text.includes('NAO_ENCONTRADA') || text.toLowerCase().includes('não encontr') || text.toLowerCase().includes('nao encontr')) {
        return res.json({ url: null, fonte: 'nao_encontrada' });
      }

      // Cifra Club: extrai só os dois primeiros segmentos para descartar /letra/, /imprimir/ etc.
      const cifraClubMatch = text.match(/https?:\/\/(?:www\.)?cifraclub\.com\.br\/([a-z0-9-]+)\/([a-z0-9-]+)/);
      if (cifraClubMatch) {
        const url = `https://www.cifraclub.com.br/${cifraClubMatch[1]}/${cifraClubMatch[2]}/`;
        return res.json({ url, fonte: 'gemini' });
      }

      // Fallback: outro site de cifras, desde que não seja página de letra
      const urlGenericaMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlGenericaMatch && !urlGenericaMatch[0].includes('/letra/')) {
        return res.json({ url: urlGenericaMatch[0], fonte: 'gemini_outro_site' });
      }

      return res.json({ url: null, fonte: 'nao_encontrada' });
    } catch (err) {
      console.error(err);
      return res.json({ url: null, fonte: 'erro', aviso: 'Busca IA indisponivel.' });
    }
  }
}

module.exports = new CifraController();
