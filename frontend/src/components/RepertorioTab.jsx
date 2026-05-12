import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';

function RepertorioTab({ ministerioId, isAdmin }) {
  const [musicas, setMusicas] = useState([]);
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', artista: '', link_cifra: '' });
  const [salvando, setSalvando] = useState(false);
  const [buscandoCifraPorId, setBuscandoCifraPorId] = useState(new Set());
  const [showNova, setShowNova] = useState(false);
  const [novaForm, setNovaForm] = useState({ nome: '', artista: '', link_cifra: '' });
  const [criando, setCriando] = useState(false);
  const [buscandoCifraNova, setBuscandoCifraNova] = useState(false);

  const carregar = async () => {
    try {
      const res = await api.get(`/ministerios/${ministerioId}/musicas`);
      setMusicas(res.data);
    } catch {
      toast.error('Erro ao carregar repertório.');
    }
  };

  useEffect(() => { carregar(); }, [ministerioId]);

  const musicasFiltradas = busca.trim()
    ? musicas.filter((m) =>
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (m.artista && m.artista.toLowerCase().includes(busca.toLowerCase()))
      )
    : musicas;

  const abrirEdicao = (m) => {
    setEditandoId(m.id);
    setEditForm({ nome: m.nome || '', artista: m.artista || '', link_cifra: m.link_cifra || '' });
  };

  const salvarEdicao = async (musicaId) => {
    if (!editForm.nome.trim()) return toast.error('Nome obrigatorio.');
    setSalvando(true);
    try {
      const res = await api.put(`/ministerios/${ministerioId}/musicas/${musicaId}`, {
        nome: editForm.nome.trim(),
        artista: editForm.artista.trim() || null,
        link_cifra: editForm.link_cifra.trim() || null,
      });
      setMusicas((prev) => prev.map((m) => m.id === musicaId ? res.data : m));
      setEditandoId(null);
      toast.success('Atualizado!');
    } catch {
      toast.error('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const buscarCifra = async (musica) => {
    setBuscandoCifraPorId((prev) => new Set([...prev, musica.id]));
    try {
      const params = new URLSearchParams({ nome: musica.nome });
      if (musica.artista) params.append('artista', musica.artista);
      const res = await api.get(`/buscar-cifra?${params}`);
      if (res.data.url) {
        await api.put(`/ministerios/${ministerioId}/musicas/${musica.id}`, {
          nome: musica.nome,
          artista: musica.artista || null,
          link_cifra: res.data.url,
        });
        setMusicas((prev) => prev.map((m) => m.id === musica.id ? { ...m, link_cifra: res.data.url } : m));
        toast.success('Cifra encontrada!');
      } else {
        toast('Cifra não encontrada. Adicione manualmente.', { duration: 4000 });
      }
    } catch {
      toast.error('Erro ao buscar cifra.');
    } finally {
      setBuscandoCifraPorId((prev) => { const s = new Set(prev); s.delete(musica.id); return s; });
    }
  };

  const buscarCifraNaEdicao = async () => {
    if (!editForm.nome.trim()) return;
    setBuscandoCifraNova(true);
    try {
      const params = new URLSearchParams({ nome: editForm.nome.trim() });
      if (editForm.artista.trim()) params.append('artista', editForm.artista.trim());
      const res = await api.get(`/buscar-cifra?${params}`);
      if (res.data.url) {
        setEditForm((p) => ({ ...p, link_cifra: res.data.url }));
        toast.success('Cifra encontrada!');
      } else {
        toast('Cifra não encontrada, adicione o link manualmente.', { duration: 3000 });
      }
    } catch {
      toast.error('Erro ao buscar cifra.');
    } finally {
      setBuscandoCifraNova(false);
    }
  };

  const buscarCifraNova = async () => {
    if (!novaForm.nome.trim()) return;
    setBuscandoCifraNova(true);
    try {
      const params = new URLSearchParams({ nome: novaForm.nome.trim() });
      if (novaForm.artista.trim()) params.append('artista', novaForm.artista.trim());
      const res = await api.get(`/buscar-cifra?${params}`);
      if (res.data.url) {
        setNovaForm((p) => ({ ...p, link_cifra: res.data.url }));
        toast.success('Cifra encontrada!');
      } else {
        toast('Cifra não encontrada, adicione o link manualmente.', { duration: 3000 });
      }
    } catch {
      toast.error('Erro ao buscar cifra.');
    } finally {
      setBuscandoCifraNova(false);
    }
  };

  const criarMusica = async () => {
    if (!novaForm.nome.trim()) return toast.error('Nome obrigatorio.');
    setCriando(true);
    try {
      const res = await api.post(`/ministerios/${ministerioId}/musicas`, {
        nome: novaForm.nome.trim(),
        artista: novaForm.artista.trim() || null,
        link_cifra: novaForm.link_cifra.trim() || null,
      });
      setMusicas((prev) => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovaForm({ nome: '', artista: '', link_cifra: '' });
      setShowNova(false);
      toast.success('Música adicionada!');
    } catch {
      toast.error('Erro ao criar música.');
    } finally {
      setCriando(false);
    }
  };

  const deletar = async (musicaId) => {
    try {
      await api.delete(`/ministerios/${ministerioId}/musicas/${musicaId}`);
      setMusicas((prev) => prev.filter((m) => m.id !== musicaId));
    } catch {
      toast.error('Erro ao remover música.');
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Barra de busca + botão adicionar */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome ou artista..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-grow bg-[#0a1a33] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
        />
        {isAdmin && (
          <button
            onClick={() => { setShowNova(true); setNovaForm({ nome: '', artista: '', link_cifra: '' }); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex-shrink-0"
          >
            <Plus size={15} /> Adicionar
          </button>
        )}
      </div>

      {/* Form nova música */}
      {showNova && (
        <div className="bg-[#0a1a33] border border-blue-500/20 rounded-2xl p-5 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Nova música</span>
            <button onClick={() => setShowNova(false)} className="text-gray-600 hover:text-white transition-colors"><X size={14} /></button>
          </div>
          <input
            className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
            placeholder="Nome da música *"
            value={novaForm.nome}
            onChange={(e) => setNovaForm((p) => ({ ...p, nome: e.target.value }))}
          />
          <input
            className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
            placeholder="Artista"
            value={novaForm.artista}
            onChange={(e) => setNovaForm((p) => ({ ...p, artista: e.target.value }))}
          />
          <div className="flex gap-2 items-center">
            <input
              className="flex-grow bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
              placeholder="Link da cifra"
              value={novaForm.link_cifra}
              onChange={(e) => setNovaForm((p) => ({ ...p, link_cifra: e.target.value }))}
              onBlur={() => { if (novaForm.nome.trim() && !novaForm.link_cifra) buscarCifraNova(); }}
            />
            <button
              onClick={buscarCifraNova}
              disabled={buscandoCifraNova}
              className="border border-blue-500/30 p-1 rounded-lg flex-shrink-0 hover:border-blue-400 transition-colors disabled:opacity-30"
            >
              {buscandoCifraNova
                ? <span className="w-3 h-3 rounded-sm bg-gray-600 animate-pulse inline-block" />
                : <img src="https://www.cifraclub.com.br/favicon.ico" alt="Cifra Club" className="w-3 h-3 rounded-sm block" onError={(e) => { e.target.style.display = 'none'; }} />
              }
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={criarMusica}
              disabled={criando}
              className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {criando ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowNova(false)} className="px-4 text-gray-500 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Contador */}
      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-4">
        {musicasFiltradas.length} {musicasFiltradas.length === 1 ? 'música' : 'músicas'}
        {busca && ` encontradas para "${busca}"`}
      </p>

      {/* Lista */}
      <div className="space-y-2">
        {musicasFiltradas.map((m) => (
          <div key={m.id}>
            {editandoId === m.id ? (
              <div className="bg-[#0a1a33] border border-blue-500/20 rounded-2xl p-4 space-y-2">
                <input
                  className="w-full bg-transparent border-b border-gray-700 py-1.5 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                  placeholder="Nome *"
                  value={editForm.nome}
                  onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))}
                />
                <input
                  className="w-full bg-transparent border-b border-gray-700 py-1.5 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                  placeholder="Artista"
                  value={editForm.artista}
                  onChange={(e) => setEditForm((p) => ({ ...p, artista: e.target.value }))}
                />
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-grow bg-transparent border-b border-gray-700 py-1.5 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                    placeholder="Link da cifra"
                    value={editForm.link_cifra}
                    onChange={(e) => setEditForm((p) => ({ ...p, link_cifra: e.target.value }))}
                  />
                  <button
                    onClick={buscarCifraNaEdicao}
                    disabled={buscandoCifraNova}
                    className="border border-blue-500/30 p-1 rounded-lg flex-shrink-0 hover:border-blue-400 transition-colors disabled:opacity-30"
                  >
                    {buscandoCifraNova
                      ? <span className="w-3 h-3 rounded-sm bg-gray-600 animate-pulse inline-block" />
                      : <img src="https://www.cifraclub.com.br/favicon.ico" alt="Cifra Club" className="w-3 h-3 rounded-sm block" onError={(e) => { e.target.style.display = 'none'; }} />
                    }
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => salvarEdicao(m.id)}
                    disabled={salvando}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check size={12} /> Salvar
                  </button>
                  <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:text-white text-xs px-3 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#0a1a33] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-white truncate">{m.nome}</p>
                  {m.artista && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{m.artista}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.link_cifra ? (
                    <a
                      href={m.link_cifra.replace(/\/letra\/?$/, '/')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-blue-500/30 p-1 rounded-lg transition-colors hover:border-blue-400"
                    >
                      <img src="https://www.cifraclub.com.br/favicon.ico" alt="Cifra Club" className="w-3 h-3 rounded-sm block" onError={(e) => { e.target.style.display='none'; }} />
                    </a>
                  ) : isAdmin ? (
                    <button
                      onClick={() => buscarCifra(m)}
                      disabled={buscandoCifraPorId.has(m.id)}
                      title="Buscar cifra"
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-blue-400 border border-gray-700 hover:border-blue-500/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-30"
                    >
                      {buscandoCifraPorId.has(m.id)
                        ? <span className="w-3 h-3 rounded-sm bg-gray-600 animate-pulse inline-block" />
                        : <img src="https://www.cifraclub.com.br/favicon.ico" alt="CC" className="w-3 h-3 rounded-sm opacity-40" onError={(e) => { e.target.style.display = 'none'; }} />
                      }
                    </button>
                  ) : null}
                  {isAdmin && (
                    <>
                      <button onClick={() => abrirEdicao(m)} className="text-gray-600 hover:text-blue-400 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deletar(m.id)} className="text-gray-700 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {musicasFiltradas.length === 0 && (
          <p className="text-gray-600 italic text-sm py-4">
            {busca ? 'Nenhuma música encontrada.' : 'Nenhuma música cadastrada ainda.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default RepertorioTab;
