import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Trash, Pencil, Check, X, Share2, BarChart2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import EscalasTab from '../components/EscalasTab';

function lerCache(id) {
  try { return JSON.parse(localStorage.getItem(`ministerio_${id}`) || 'null'); } catch { return null; }
}

function salvarCache(id, dados) {
  try { localStorage.setItem(`ministerio_${id}`, JSON.stringify(dados)); } catch {}
}

function Ministerio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const cached = lerCache(id);
  const [ministerio, setMinisterio] = useState(cached?.ministerio ?? null);
  const [membros, setMembros] = useState(cached?.membros ?? []);
  const [funcoes, setFuncoes] = useState(cached?.funcoes ?? []);
  const [isAdmin, setIsAdmin] = useState(() => {
    const m = cached?.membros?.find((m) => m.id === user.id);
    return m?.permissao === 'admin';
  });
  const [novaFuncao, setNovaFuncao] = useState('');
  const [showAdicionarFuncao, setShowAdicionarFuncao] = useState(false);
  const [erro, setErro] = useState(false);
  const [showConfirmarExcluir, setShowConfirmarExcluir] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [editandoFuncaoId, setEditandoFuncaoId] = useState(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [editandoNomeMin, setEditandoNomeMin] = useState(false);
  const [nomeMinTemp, setNomeMinTemp] = useState('');
  const [tabAtiva, setTabAtiva] = useState('membros');
  const [stats, setStats] = useState([]);
  const [substituicoes, setSubstituicoes] = useState([]);
  const [showEditFuncoes, setShowEditFuncoes] = useState(false);
  const [funcoesMinhasSel, setFuncoesMinhasSel] = useState([]);
  const [showEscolherSub, setShowEscolherSub] = useState(null);
  const [substitutoSel, setSubstitutoSel] = useState(null);
  const [aprovandoSub, setAprovandoSub] = useState(false);

  const carregar = async () => {
    try {
      const [resMin, resMembros, resFuncoes] = await Promise.all([
        api.get(`/ministerios/${id}`),
        api.get(`/ministerios/${id}/membros`),
        api.get(`/ministerios/${id}/funcoes`),
      ]);
      setMinisterio(resMin.data);
      setMembros(resMembros.data);
      setFuncoes(resFuncoes.data);
      const membroAtual = resMembros.data.find((m) => m.id === user.id);
      setIsAdmin(membroAtual?.permissao === 'admin');
      salvarCache(id, { ministerio: resMin.data, membros: resMembros.data, funcoes: resFuncoes.data });
    } catch {
      if (!ministerio) setErro(true);
      else toast.error('Erro ao atualizar dados.');
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  useEffect(() => {
    if (tabAtiva !== 'stats' || !isAdmin) return;
    api.get(`/ministerios/${id}/stats`).then((res) => setStats(res.data)).catch(() => {});
  }, [tabAtiva, id, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get(`/substituicoes?ministerioId=${id}&status=pendente`).then((res) => setSubstituicoes(res.data)).catch(() => {});
  }, [id, isAdmin]);

  const adicionarFuncao = async () => {
    if (!novaFuncao.trim()) return;
    try {
      await api.post(`/ministerios/${id}/funcoes`, { nome: novaFuncao });
      setNovaFuncao('');
      setShowAdicionarFuncao(false);
      carregar();
      toast.success('Funcao adicionada!');
    } catch {
      toast.error('Erro ao adicionar funcao.');
    }
  };

  const excluirMinisterio = async () => {
    setDeletando(true);
    try {
      await api.delete(`/ministerios/${id}`, { data: { usuario_id: user.id } });
      localStorage.removeItem(`ministerio_${id}`);
      navigate('/home');
    } catch {
      toast.error('Erro ao excluir ministerio.');
      setDeletando(false);
      setShowConfirmarExcluir(false);
    }
  };

  const iniciarEdicao = (f) => {
    setEditandoFuncaoId(f.id);
    setNomeEditando(f.nome);
  };

  const cancelarEdicao = () => {
    setEditandoFuncaoId(null);
    setNomeEditando('');
  };

  const salvarEdicaoFuncao = async (funcaoId) => {
    if (!nomeEditando.trim()) return;
    try {
      await api.put(`/ministerios/${id}/funcoes/${funcaoId}`, { nome: nomeEditando });
      cancelarEdicao();
      carregar();
    } catch {
      toast.error('Erro ao editar funcao.');
    }
  };

  const salvarNomeMinisterio = async () => {
    if (!nomeMinTemp.trim() || nomeMinTemp.trim() === ministerio.nome) {
      setEditandoNomeMin(false);
      return;
    }
    try {
      const res = await api.put(`/ministerios/${id}`, { nome: nomeMinTemp.trim() });
      setMinisterio((prev) => ({ ...prev, nome: res.data.nome }));
      salvarCache(id, { ministerio: { ...ministerio, nome: res.data.nome }, membros, funcoes });
      const cache = JSON.parse(localStorage.getItem('ministerios_cache') || '[]');
      localStorage.setItem('ministerios_cache', JSON.stringify(cache.map((m) => m.id === Number(id) ? { ...m, nome: res.data.nome } : m)));
      setEditandoNomeMin(false);
      toast.success('Nome atualizado!');
    } catch {
      toast.error('Erro ao atualizar nome.');
    }
  };

  const abrirEditFuncoes = () => {
    const meuMembro = membros.find((m) => m.id === user.id);
    setFuncoesMinhasSel(meuMembro?.funcoes?.map((f) => f.id) || []);
    setShowEditFuncoes(true);
  };

  const salvarMinhasFuncoes = async () => {
    try {
      await api.post(`/ministerios/${id}/membro-funcoes`, {
        usuario_id: user.id,
        funcao_ids: funcoesMinhasSel,
      });
      setShowEditFuncoes(false);
      carregar();
      toast.success('Funções atualizadas!');
    } catch {
      toast.error('Erro ao salvar funcoes.');
    }
  };

  const responderSubstituicao = async (subId, status) => {
    try {
      await api.put(`/substituicoes/${subId}`, { status });
      setSubstituicoes((prev) => prev.filter((s) => s.id !== subId));
      toast.success(status === 'aprovado' ? 'Pedido aprovado!' : 'Pedido rejeitado.');
    } catch {
      toast.error('Erro ao responder pedido.');
    }
  };

  const aprovarComSubstituto = async () => {
    if (!substitutoSel || !showEscolherSub) return;
    setAprovandoSub(true);
    try {
      await api.patch(`/substituicoes/${showEscolherSub.id}/aprovar`, { substituto_id: substitutoSel });
      setSubstituicoes((prev) => prev.filter((s) => s.id !== showEscolherSub.id));
      setShowEscolherSub(null);
      setSubstitutoSel(null);
      toast.success('Substituto definido!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao aprovar substituicao.');
    } finally {
      setAprovandoSub(false);
    }
  };

  const deletarFuncao = async (funcaoId) => {
    try {
      await api.delete(`/ministerios/${id}/funcoes/${funcaoId}`);
      carregar();
    } catch {
      toast.error('Erro ao remover funcao.');
    }
  };

  if (erro) {
    return (
      <div className="flex min-h-screen bg-[#050b18]">
        <Sidebar />
        <main className="lg:ml-64 flex-grow flex flex-col items-center justify-center gap-4 text-gray-500">
          <p>Nao foi possivel carregar o ministerio.</p>
          <button
            onClick={() => { setErro(false); carregar(); }}
            className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => navigate('/home')}
            className="text-gray-600 hover:text-white text-sm transition-colors"
          >
            Voltar
          </button>
        </main>
      </div>
    );
  }

  if (!ministerio) {
    return (
      <div className="flex min-h-screen bg-[#050b18]">
        <Sidebar />
        <main className="lg:ml-64 flex-grow flex items-center justify-center text-gray-500">
          Carregando...
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <Toaster />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex justify-between items-start">
            <div>
              {editandoNomeMin ? (
                <div className="flex items-center gap-2">
                  <input
                    className="text-3xl font-bold tracking-tighter text-blue-400 bg-transparent border-b border-blue-500 outline-none w-64"
                    value={nomeMinTemp}
                    onChange={(e) => setNomeMinTemp(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') salvarNomeMinisterio(); if (e.key === 'Escape') setEditandoNomeMin(false); }}
                    autoFocus
                  />
                  <button onClick={salvarNomeMinisterio} className="text-green-400 hover:text-green-300 transition-colors"><Check size={18} /></button>
                  <button onClick={() => setEditandoNomeMin(false)} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-3xl font-bold tracking-tighter text-blue-400">{ministerio.nome}</h1>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => { setNomeMinTemp(ministerio.nome); setEditandoNomeMin(true); }}
                        className="text-gray-700 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="text-gray-600 font-mono text-xs mt-1 tracking-widest uppercase">
                Codigo: {ministerio.codigo_acesso}
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/m/' + id);
                    toast.success('Link copiado!');
                  }}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors text-sm"
                  title="Compartilhar agenda publica"
                >
                  <Share2 size={15} /> Compartilhar
                </button>
                <button
                  onClick={() => setShowConfirmarExcluir(true)}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-400 transition-colors text-sm"
                >
                  <Trash size={16} /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pedidos de substituicao pendentes */}
        {isAdmin && substituicoes.length > 0 && (
          <div className="mb-6 max-w-lg space-y-2">
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-3">
              {substituicoes.length} pedido{substituicoes.length > 1 ? 's' : ''} de substituição
            </p>
            {substituicoes.map((s) => (
              <div key={s.id} className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{s.solicitante_nome}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {s.escala_nome} · {s.data_evento?.split('T')[0].split('-').reverse().join('/')}
                  </p>
                  {s.motivo && <p className="text-[10px] text-gray-600 mt-0.5 italic">{s.motivo}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setShowEscolherSub(s); setSubstitutoSel(null); }}
                    className="text-xs font-bold bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Substituto
                  </button>
                  <button
                    onClick={() => responderSubstituicao(s.id, 'rejeitado')}
                    className="text-xs font-bold bg-white/5 text-gray-500 hover:text-red-400 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#0a1a33] p-1 rounded-2xl w-fit">
          {['membros', 'escalas', ...(isAdmin ? ['funcoes', 'stats'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setTabAtiva(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tabAtiva === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab === 'stats' ? <BarChart2 size={14} /> : { membros: 'Membros', escalas: 'Escalas', funcoes: 'Funções' }[tab] ?? tab}
            </button>
          ))}
        </div>

        {tabAtiva === 'escalas' && (
          <EscalasTab ministerioId={id} isAdmin={isAdmin} membros={membros} funcoes={funcoes} />
        )}

        {tabAtiva === 'membros' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-2xl">
          <div>
            <div className="space-y-3">
              {membros.map((m) => (
                <div key={m.id} className="bg-[#0a1a33] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {m.foto_url ? (
                      <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                        {m.nome?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-sm truncate">{m.nome}</p>
                    {m.funcoes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.funcoes.map((f) => (
                          <span key={f.id} className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">
                            {f.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.permissao === 'admin' && (
                      <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Admin</span>
                    )}
                    {m.id === user.id && (
                      <button
                        onClick={abrirEditFuncoes}
                        className="text-gray-600 hover:text-blue-400 transition-colors"
                        title="Editar minhas funcoes"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {membros.length === 0 && (
                <p className="text-gray-600 italic text-sm">Nenhum membro ainda.</p>
              )}
            </div>
          </div>
        </div>
        )}

        {tabAtiva === 'stats' && isAdmin && (
          <div className="max-w-lg">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Participacao dos membros</h2>
            {stats.length === 0 && <p className="text-gray-600 italic text-sm">Nenhum dado ainda.</p>}
            <div className="space-y-3">
              {stats.map((s, i) => {
                const taxa = s.total_participacoes > 0 ? Math.round((s.total_confirmados / s.total_participacoes) * 100) : 0;
                return (
                  <div key={s.id} className="bg-[#0a1a33] px-4 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                    <span className="text-gray-700 text-xs font-bold w-5 text-right flex-shrink-0">{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {s.foto_url ? (
                        <img src={s.foto_url} alt={s.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-blue-400">{s.nome?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold truncate">{s.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-grow bg-white/5 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${taxa}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{taxa}%</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold text-sm">{s.total_participacoes}</p>
                      <p className="text-[10px] text-gray-600">escalas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tabAtiva === 'funcoes' && isAdmin && (
          <div className="max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Funções</h2>
              <button
                onClick={() => setShowAdicionarFuncao(!showAdicionarFuncao)}
                className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            {showAdicionarFuncao && (
              <div className="mb-4 flex gap-2">
                <input
                  className="flex-grow bg-[#0a1a33] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={novaFuncao}
                  onChange={(e) => setNovaFuncao(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && adicionarFuncao()}
                  autoFocus
                />
                <button onClick={adicionarFuncao} className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-xl text-sm font-bold transition-all">
                  OK
                </button>
              </div>
            )}

            <div className="space-y-2">
              {funcoes.map((f) => (
                <div key={f.id} className="bg-[#0a1a33] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-2">
                  {editandoFuncaoId === f.id ? (
                    <>
                      <input
                        className="flex-grow bg-transparent border-b border-blue-500 outline-none text-sm py-0.5"
                        value={nomeEditando}
                        onChange={(e) => setNomeEditando(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') salvarEdicaoFuncao(f.id);
                          if (e.key === 'Escape') cancelarEdicao();
                        }}
                        autoFocus
                      />
                      <button onClick={() => salvarEdicaoFuncao(f.id)} className="text-green-400 hover:text-green-300 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={cancelarEdicao} className="text-gray-600 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-grow text-sm">{f.nome}</span>
                      <button onClick={() => iniciarEdicao(f)} className="text-gray-600 hover:text-blue-400 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deletarFuncao(f.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {funcoes.length === 0 && (
                <p className="text-gray-600 italic text-sm">Nenhuma funcao cadastrada.</p>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Modal: editar próprias funções */}
      {showEditFuncoes && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-7 border border-white/10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Minhas funcoes</h3>
              <button onClick={() => setShowEditFuncoes(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            {funcoes.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Nenhuma funcao cadastrada neste ministerio.</p>
            ) : (
              <div className="space-y-2 mb-5">
                {funcoes.map((f) => (
                  <label key={f.id} className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-500"
                      checked={funcoesMinhasSel.includes(f.id)}
                      onChange={(e) => {
                        setFuncoesMinhasSel((prev) =>
                          e.target.checked ? [...prev, f.id] : prev.filter((id) => id !== f.id)
                        );
                      }}
                    />
                    <span className="text-sm text-white">{f.nome}</span>
                  </label>
                ))}
              </div>
            )}
            <button
              onClick={salvarMinhasFuncoes}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {showEscolherSub && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Escolher substituto</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {showEscolherSub.solicitante_nome} · {showEscolherSub.escala_nome}
                </p>
              </div>
              <button onClick={() => setShowEscolherSub(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {membros
                .filter((m) => {
                  if (m.id === showEscolherSub.solicitante_id) return false;
                  if (!showEscolherSub.funcao_solicitante) return true;
                  return m.funcoes?.some((f) => f.id === showEscolherSub.funcao_solicitante);
                })
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSubstitutoSel(m.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      substitutoSel === m.id ? 'bg-blue-600/20 border border-blue-500/40' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {m.foto_url ? (
                        <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-blue-400">{m.nome?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.nome}</p>
                      {m.funcoes?.length > 0 && (
                        <p className="text-[10px] text-gray-500 truncate">{m.funcoes.map((f) => f.nome).join(', ')}</p>
                      )}
                    </div>
                  </button>
                ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <button
                onClick={aprovarComSubstituto}
                disabled={!substitutoSel || aprovandoSub}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
              >
                {aprovandoSub ? 'Salvando...' : 'Confirmar substituto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmarExcluir && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-8 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-2">Excluir ministerio?</h2>
            <p className="text-gray-500 text-sm mb-8">
              Esta acao e irreversivel. Todos os membros e funcoes serao removidos.
            </p>
            <button
              onClick={excluirMinisterio}
              disabled={deletando}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 mb-3"
            >
              {deletando ? 'Excluindo...' : 'Sim, excluir'}
            </button>
            <button
              onClick={() => setShowConfirmarExcluir(false)}
              disabled={deletando}
              className="w-full text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ministerio;
