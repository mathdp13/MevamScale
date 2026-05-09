import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Trash, Pencil, Check, X } from 'lucide-react';
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
                    <button
                      onClick={() => { setNomeMinTemp(ministerio.nome); setEditandoNomeMin(true); }}
                      className="text-gray-700 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
              <p className="text-gray-600 font-mono text-xs mt-1 tracking-widest uppercase">
                Codigo: {ministerio.codigo_acesso}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowConfirmarExcluir(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-red-400 transition-colors text-sm"
              >
                <Trash size={16} /> Excluir ministerio
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#0a1a33] p-1 rounded-2xl w-fit">
          {['membros', 'escalas', ...(isAdmin ? ['funcoes'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setTabAtiva(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tabAtiva === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab}
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
                  {m.permissao === 'admin' && (
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex-shrink-0">Admin</span>
                  )}
                </div>
              ))}
              {membros.length === 0 && (
                <p className="text-gray-600 italic text-sm">Nenhum membro ainda.</p>
              )}
            </div>
          </div>
        </div>
        )}

        {tabAtiva === 'funcoes' && isAdmin && (
          <div className="max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Funcoes</h2>
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
