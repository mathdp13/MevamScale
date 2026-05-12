import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, Plus, Check, Trash2, AlertCircle, Send, Music } from 'lucide-react';

const TONS = ['A','Am','Bb','Bbm','B','Bm','C','Cm','C#','C#m','D','Dm','Eb','Ebm','E','Em','F','Fm','F#','F#m','G','Gm','Ab','Abm'];

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function EscalaDetalhe({ escala, isAdmin, membros, funcoes, ministerioId, onFechar, onAtualizar }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab, setTab] = useState('membros');

  // --- Membros ---
  const [membrosEscala, setMembrosEscala] = useState([]);
  const [showAdicionarMembro, setShowAdicionarMembro] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [ausencias, setAusencias] = useState([]);

  // --- Setlist ---
  const [setlist, setSetlist] = useState([]);
  const [musicasMin, setMusicasMin] = useState([]);
  const [showAddMusica, setShowAddMusica] = useState(false);
  const [novaMusica, setNovaMusica] = useState({ nome: '', artista: '', link_cifra: '' });
  const [criandoMusica, setCriandoMusica] = useState(false);
  const [showFormNova, setShowFormNova] = useState(false);
  const [buscandoCifra, setBuscandoCifra] = useState(false);
  const [tomSelecionado, setTomSelecionado] = useState('');
  const [musicaPendente, setMusicaPendente] = useState(null);

  // --- Chat ---
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const chatEndRef = useRef(null);

  const carregarMembros = async () => {
    try {
      const res = await api.get(`/escalas/${escala.id}/membros`);
      setMembrosEscala(res.data);
    } catch {
      toast.error('Erro ao carregar membros.');
    }
  };

  const carregarSetlist = async () => {
    try {
      const [resSetlist, resMusicas] = await Promise.all([
        api.get(`/escalas/${escala.id}/setlist`),
        api.get(`/ministerios/${ministerioId}/musicas`),
      ]);
      setSetlist(resSetlist.data);
      setMusicasMin(resMusicas.data);
    } catch {
      toast.error('Erro ao carregar setlist.');
    }
  };

  const carregarMensagens = async () => {
    try {
      const res = await api.get(`/escalas/${escala.id}/mensagens`);
      setMensagens(res.data);
    } catch {}
  };

  useEffect(() => {
    carregarMembros();
    if (isAdmin && ministerioId && escala.data_evento) {
      const parts = escala.data_evento.split('T')[0].split('-');
      api.get(`/ausencias?ministerioId=${ministerioId}&mes=${parseInt(parts[1], 10)}&ano=${parts[0]}`)
        .then((res) => setAusencias(res.data))
        .catch(() => {});
    }
  }, [escala.id]);

  useEffect(() => {
    if (tab === 'setlist') carregarSetlist();
    if (tab === 'chat') {
      carregarMensagens();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, tab]);

  // ---- Membros ----
  const adicionarSelecionados = async () => {
    if (selecionados.length === 0) return;
    setAdicionando(true);
    try {
      await Promise.all(
        selecionados.map((id) => {
          const membro = membros.find((m) => m.id === id);
          const funcaoId = membro?.funcoes?.[0]?.id || null;
          return api.post(`/escalas/${escala.id}/membros`, { usuario_id: id, funcao_id: funcaoId });
        })
      );
      setSelecionados([]);
      setShowAdicionarMembro(false);
      carregarMembros();
      onAtualizar();
    } catch {
      toast.error('Erro ao adicionar membros.');
    } finally {
      setAdicionando(false);
    }
  };

  const toggleSelecionado = (id) => {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleTodos = () => {
    const disponiveis = membroNaoAdicionados.map((m) => m.id);
    setSelecionados((prev) => prev.length === disponiveis.length ? [] : disponiveis);
  };

  const removerMembro = async (usuarioId) => {
    try {
      await api.delete(`/escalas/${escala.id}/membros/${usuarioId}`);
      carregarMembros();
      onAtualizar();
    } catch {
      toast.error('Erro ao remover membro.');
    }
  };

  const confirmar = async (usuarioId, confirmado) => {
    try {
      await api.put(`/escalas/${escala.id}/membros/${usuarioId}/confirmar`, { confirmado });
      carregarMembros();
    } catch {
      toast.error('Erro ao confirmar presenca.');
    }
  };

  // ---- Setlist ----
  const selecionarMusicaDaLib = (m) => {
    setMusicaPendente(m);
    setTomSelecionado('');
  };

  const confirmarMusicaDaLib = async () => {
    if (!musicaPendente) return;
    try {
      await api.post(`/escalas/${escala.id}/setlist`, { musica_id: musicaPendente.id, tom: tomSelecionado || null });
      carregarSetlist();
      setMusicaPendente(null);
      setTomSelecionado('');
      setShowAddMusica(false);
    } catch {
      toast.error('Erro ao adicionar musica.');
    }
  };

  const buscarCifraIA = async () => {
    if (!novaMusica.nome.trim()) return toast.error('Digite o nome da musica primeiro.');
    setBuscandoCifra(true);
    try {
      const params = new URLSearchParams({ nome: novaMusica.nome.trim() });
      if (novaMusica.artista.trim()) params.append('artista', novaMusica.artista.trim());
      const res = await api.get(`/buscar-cifra?${params}`);
      if (res.data.url) {
        setNovaMusica((p) => ({ ...p, link_cifra: res.data.url }));
        toast.success('Cifra encontrada!');
      } else {
        toast('Cifra não disponivel no Cifra Club para esta musica. Adicione um link manualmente se souber.', { duration: 4000 });
      }
    } catch {
      toast.error('Erro ao buscar cifra.');
    } finally {
      setBuscandoCifra(false);
    }
  };

  const salvarNovaMusica = async () => {
    if (!novaMusica.nome.trim()) return toast.error('Nome obrigatorio.');
    setCriandoMusica(true);
    const linkFinal = novaMusica.link_cifra.trim() || null;
    try {
      const res = await api.post(`/ministerios/${ministerioId}/musicas`, {
        nome: novaMusica.nome.trim(),
        artista: novaMusica.artista.trim() || null,
        link_cifra: linkFinal,
      });
      await api.post(`/escalas/${escala.id}/setlist`, { musica_id: res.data.id, tom: tomSelecionado || null });
      setNovaMusica({ nome: '', artista: '', link_cifra: '' });
      setTomSelecionado('');
      setShowFormNova(false);
      carregarSetlist();
    } catch {
      toast.error('Erro ao criar musica.');
    } finally {
      setCriandoMusica(false);
    }
  };

  const removerDoSetlist = async (itemId) => {
    try {
      await api.delete(`/escalas/${escala.id}/setlist/${itemId}`);
      setSetlist((prev) => prev.filter((s) => s.id !== itemId));
    } catch {
      toast.error('Erro ao remover musica.');
    }
  };

  // ---- Chat ----
  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || enviando) return;
    setEnviando(true);
    const texto = novaMensagem.trim();
    setNovaMensagem('');
    try {
      const res = await api.post(`/escalas/${escala.id}/mensagens`, { usuario_id: user.id, texto });
      setMensagens((prev) => [...prev, { ...res.data, usuario_nome: user.nome, foto_url: user.foto_url }]);
    } catch {
      toast.error('Erro ao enviar mensagem.');
      setNovaMensagem(texto);
    } finally {
      setEnviando(false);
    }
  };

  const formatarHora = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatarData = (data) => {
    if (!data) return null;
    const [a, m, d] = data.split('T')[0].split('-');
    return `${d}/${m}/${a}`;
  };

  const membroNaoAdicionados = membros.filter((m) => !membrosEscala.find((me) => me.usuario_id === m.id));
  const dataEscala = escala.data_evento?.split('T')[0];
  const ausenciasNaData = ausencias.filter((a) => a.data?.split('T')[0] === dataEscala).map((a) => a.usuario_id);
  const euEstouNaEscala = membrosEscala.find((m) => m.usuario_id === user.id);
  const musicasNaoNoSetlist = musicasMin.filter((m) => !setlist.find((s) => s.musica_id === m.id));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
      <div className="bg-[#0a1a33] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">{escala.nome}</h3>
            <div className="flex gap-3 mt-1">
              <span className="text-[10px] text-gray-500 font-mono">Evento: {formatarData(escala.data_evento)}</span>
              {escala.data_ensaio && (
                <span className="text-[10px] text-gray-500 font-mono">Ensaio: {formatarData(escala.data_ensaio)}</span>
              )}
            </div>
          </div>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Confirmacao propria */}
        {euEstouNaEscala && (
          <div className="px-6 py-3 bg-blue-600/10 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <span className="text-sm text-blue-400 font-bold">Você esta nesta escala</span>
            <button
              onClick={() => confirmar(user.id, !euEstouNaEscala.confirmado)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                euEstouNaEscala.confirmado ? 'bg-green-600/20 text-green-400' : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {euEstouNaEscala.confirmado ? 'Confirmado' : 'Confirmar presenca'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          {['membros', 'setlist', 'chat'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                tab === t ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {t === 'setlist' ? 'Setlist' : t === 'chat' ? 'Chat' : 'Membros'}
            </button>
          ))}
        </div>

        {/* ---- Tab Membros ---- */}
        {tab === 'membros' && (
          <>
            <div className="flex-grow overflow-y-auto p-6 space-y-2">
              {membrosEscala.map((m) => (
                <div key={m.id} className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {m.foto_url ? (
                      <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                        {m.nome?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-white truncate">{m.nome}</p>
                    {m.funcao_nome && <span className="text-[10px] text-blue-400">{m.funcao_nome}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.confirmado ? (
                      <span className="text-[10px] text-green-400 font-bold">Confirmado</span>
                    ) : (
                      <span className="text-[10px] text-gray-600">Pendente</span>
                    )}
                    {isAdmin && (
                      <button onClick={() => removerMembro(m.usuario_id)} className="text-gray-700 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {membrosEscala.length === 0 && (
                <p className="text-gray-600 italic text-sm">Nenhum membro adicionado ainda.</p>
              )}
            </div>

            {isAdmin && (
              <div className="border-t border-white/5 flex-shrink-0">
                {showAdicionarMembro ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        {selecionados.length > 0 ? `${selecionados.length} selecionado${selecionados.length > 1 ? 's' : ''}` : 'Selecionar membros'}
                      </span>
                      <button onClick={toggleTodos} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors">
                        {selecionados.length === membroNaoAdicionados.length && membroNaoAdicionados.length > 0 ? 'Desmarcar todos' : 'Selecionar todos'}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto mb-3">
                      {membroNaoAdicionados.map((m) => {
                        const ausente = ausenciasNaData.includes(m.id);
                        const checked = selecionados.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleSelecionado(m.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                              checked ? 'bg-blue-600/15 border border-blue-500/30' : 'bg-white/3 border border-transparent hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600'}`}>
                              {checked && <Check size={10} className="text-white" />}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                              {m.foto_url ? (
                                <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                  {m.nome?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-bold text-white truncate">{m.nome}</p>
                              {m.funcoes?.[0] && <span className="text-[10px] text-blue-400">{m.funcoes[0].nome}</span>}
                            </div>
                            {ausente && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <AlertCircle size={11} className="text-orange-400" />
                                <span className="text-[9px] text-orange-400 font-bold">ausente</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {membroNaoAdicionados.length === 0 && (
                        <p className="text-gray-600 text-xs italic py-2">Todos os membros ja estao na escala.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={adicionarSelecionados}
                        disabled={adicionando || selecionados.length === 0}
                        className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
                      >
                        {adicionando ? 'Adicionando...' : selecionados.length === 0 ? 'Selecione membros' : `Adicionar ${selecionados.length}`}
                      </button>
                      <button
                        onClick={() => { setShowAdicionarMembro(false); setSelecionados([]); }}
                        className="px-4 text-gray-500 hover:text-white transition-colors text-sm font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <button
                      onClick={() => setShowAdicionarMembro(true)}
                      disabled={membroNaoAdicionados.length === 0}
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={15} /> Adicionar membros
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ---- Tab Setlist ---- */}
        {tab === 'setlist' && (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {setlist.length === 0 && !showAddMusica && (
                <p className="text-gray-600 italic text-sm py-2">Nenhuma musica no setlist ainda.</p>
              )}
              {setlist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl">
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.nome}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {item.artista || 'Artista desconhecido'}
                      {item.tom && <span className="ml-2 text-blue-400 font-bold">Tom: {item.tom}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.link_cifra ? (
                      <a
                        href={item.link_cifra.replace(/\/letra\/?$/, '/')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30 px-2 py-1 rounded-lg"
                      >
                        <img src="https://www.cifraclub.com.br/favicon.ico" alt="CC" className="w-3 h-3 rounded-sm" onError={(e) => { e.target.style.display='none'; }} />
                        Cifra
                      </a>
                    ) : null}
                    <button onClick={() => removerDoSetlist(item.id)} className="text-gray-700 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Painel adicionar música */}
              {showAddMusica && (
                <div className="bg-[#050b18] rounded-2xl border border-white/10 p-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Adicionar ao setlist</span>
                    <button onClick={() => { setShowAddMusica(false); setShowFormNova(false); }} className="text-gray-600 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Seleção de tom para música da biblioteca */}
                  {musicaPendente && (
                    <div className="mb-3 bg-blue-600/10 border border-blue-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-white mb-2 truncate">{musicaPendente.nome}</p>
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-grow bg-[#050b18] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                          value={tomSelecionado}
                          onChange={(e) => setTomSelecionado(e.target.value)}
                        >
                          <option value="">Tom (opcional)</option>
                          {TONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          onClick={confirmarMusicaDaLib}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                        >
                          Adicionar
                        </button>
                        <button onClick={() => setMusicaPendente(null)} className="text-gray-500 hover:text-white text-xs px-1">×</button>
                      </div>
                    </div>
                  )}

                  {/* Lista de músicas do ministério não adicionadas */}
                  {!musicaPendente && musicasNaoNoSetlist.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                      {musicasNaoNoSetlist.map((m) => (
                        <div key={m.id} className="flex items-center gap-1 group">
                          <button
                            onClick={() => selecionarMusicaDaLib(m)}
                            className="flex-grow flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-600/15 transition-colors text-left"
                          >
                            <Music size={12} className="text-blue-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-white font-bold truncate">{m.nome}</p>
                              {m.artista && <p className="text-[10px] text-gray-500 truncate">{m.artista}</p>}
                            </div>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await api.delete(`/ministerios/${ministerioId}/musicas/${m.id}`);
                                setMusicasMin((prev) => prev.filter((x) => x.id !== m.id));
                              } catch {
                                toast.error('Erro ao remover musica.');
                              }
                            }}
                            className="text-gray-700 hover:text-red-400 transition-colors p-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showFormNova ? (
                    <button
                      onClick={() => setShowFormNova(true)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors border border-dashed border-gray-700 hover:border-blue-500/40 rounded-xl py-2"
                    >
                      <Plus size={12} /> Nova música
                    </button>
                  ) : (
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <input
                        className="w-full bg-transparent border-b border-gray-700 py-1.5 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                        placeholder="Nome da música *"
                        value={novaMusica.nome}
                        onChange={(e) => setNovaMusica((p) => ({ ...p, nome: e.target.value, link_cifra: '' }))}
                      />
                      <div className="flex items-end gap-2">
                        <input
                          className="flex-grow bg-transparent border-b border-gray-700 py-1.5 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                          placeholder="Artista (opcional)"
                          value={novaMusica.artista}
                          onChange={(e) => setNovaMusica((p) => ({ ...p, artista: e.target.value, link_cifra: '' }))}
                          onBlur={() => {
                            if (novaMusica.nome.trim() && novaMusica.artista.trim()) buscarCifraIA();
                          }}
                        />
                        {buscandoCifra && (
                          <span className="text-[10px] text-blue-400 animate-pulse flex-shrink-0 mb-0.5">Buscando cifra...</span>
                        )}
                      </div>
                      {novaMusica.link_cifra && (
                        <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-lg px-3 py-2">
                          <img src="https://www.cifraclub.com.br/favicon.ico" alt="CC" className="w-3 h-3 flex-shrink-0" onError={(e) => { e.target.style.display='none'; }} />
                          <span className="text-[10px] text-blue-400 truncate flex-grow">
                            {novaMusica.link_cifra.replace('https://www.', '')}
                          </span>
                          <a
                            href={novaMusica.link_cifra}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 font-bold hover:text-blue-300 flex-shrink-0"
                          >
                            Testar
                          </a>
                        </div>
                      )}
                      <input
                        className="w-full bg-transparent border-b border-gray-700 py-1.5 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                        placeholder="Link alternativo (deixe vazio para usar o gerado)"
                        value={novaMusica.link_cifra}
                        onChange={(e) => setNovaMusica((p) => ({ ...p, link_cifra: e.target.value }))}
                      />
                      <select
                        className="w-full bg-[#050b18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                        value={tomSelecionado}
                        onChange={(e) => setTomSelecionado(e.target.value)}
                      >
                        <option value="">Tom (opcional)</option>
                        {TONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={salvarNovaMusica}
                          disabled={criandoMusica}
                          className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                          {criandoMusica ? 'Salvando...' : 'Adicionar ao setlist'}
                        </button>
                        <button onClick={() => setShowFormNova(false)} className="text-gray-500 hover:text-white text-xs px-3">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!showAddMusica && (
              <div className="border-t border-white/5 p-4 flex-shrink-0">
                <button
                  onClick={() => setShowAddMusica(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors py-2"
                >
                  <Plus size={15} /> Adicionar música
                </button>
              </div>
            )}
          </>
        )}

        {/* ---- Tab Chat ---- */}
        {tab === 'chat' && (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {mensagens.length === 0 && (
                <p className="text-gray-600 italic text-sm py-2">Nenhuma mensagem ainda. Seja o primeiro!</p>
              )}
              {mensagens.map((msg) => {
                const souEu = msg.usuario_id === user.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${souEu ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {msg.foto_url ? (
                        <img src={msg.foto_url} alt={msg.usuario_nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-blue-400">{msg.usuario_nome?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className={`max-w-[75%] ${souEu ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`flex items-baseline gap-1.5 mb-0.5 ${souEu ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-bold text-gray-400">{souEu ? 'Você' : msg.usuario_nome?.split(' ')[0]}</span>
                        <span className="text-[9px] text-gray-700">{formatarHora(msg.criado_em)}</span>
                      </div>
                      <div className={`px-3 py-2 rounded-2xl text-sm ${souEu ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/8 text-gray-200 rounded-tl-sm'}`}>
                        {msg.texto}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-white/5 p-3 flex gap-2 flex-shrink-0">
              <input
                className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                placeholder="Mensagem..."
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              />
              <button
                onClick={enviarMensagem}
                disabled={!novaMensagem.trim() || enviando}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EscalaDetalhe;
