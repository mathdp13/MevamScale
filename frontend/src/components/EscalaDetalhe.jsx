import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, Plus, Check, Trash2, AlertCircle } from 'lucide-react';

function EscalaDetalhe({ escala, isAdmin, membros, funcoes, ministerioId, onFechar, onAtualizar }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [membrosEscala, setMembrosEscala] = useState([]);
  const [showAdicionarMembro, setShowAdicionarMembro] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [ausencias, setAusencias] = useState([]);

  const carregarMembros = async () => {
    try {
      const res = await api.get(`/escalas/${escala.id}/membros`);
      setMembrosEscala(res.data);
    } catch {
      toast.error('Erro ao carregar membros.');
    }
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
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    const disponiveis = membroNaoAdicionados.map((m) => m.id);
    setSelecionados((prev) =>
      prev.length === disponiveis.length ? [] : disponiveis
    );
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

  const formatarData = (data) => {
    if (!data) return null;
    const [a, m, d] = data.split('T')[0].split('-');
    return `${d}/${m}/${a}`;
  };

  const membroNaoAdicionados = membros.filter(
    (m) => !membrosEscala.find((me) => me.usuario_id === m.id)
  );

  const dataEscala = escala.data_evento?.split('T')[0];
  const ausenciasNaData = ausencias.filter((a) => a.data?.split('T')[0] === dataEscala).map((a) => a.usuario_id);

  const euEstouNaEscala = membrosEscala.find((m) => m.usuario_id === user.id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
      <div className="bg-[#0a1a33] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start">
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
          <div className="px-6 py-3 bg-blue-600/10 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm text-blue-400 font-bold">Voce esta nesta escala</span>
            <button
              onClick={() => confirmar(user.id, !euEstouNaEscala.confirmado)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                euEstouNaEscala.confirmado
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {euEstouNaEscala.confirmado ? 'Confirmado' : 'Confirmar presenca'}
            </button>
          </div>
        )}

        {/* Lista de membros */}
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
                {m.funcao_nome && (
                  <span className="text-[10px] text-blue-400">{m.funcao_nome}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.confirmado ? (
                  <span className="text-[10px] text-green-400 font-bold">Confirmado</span>
                ) : (
                  <span className="text-[10px] text-gray-600">Pendente</span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => removerMembro(m.usuario_id)}
                    className="text-gray-700 hover:text-red-400 transition-colors"
                  >
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

        {/* Adicionar membro (admin) */}
        {isAdmin && (
          <div className="border-t border-white/5">
            {showAdicionarMembro ? (
              <div className="p-4">
                {/* Header com "Selecionar todos" */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    {selecionados.length > 0 ? `${selecionados.length} selecionado${selecionados.length > 1 ? 's' : ''}` : 'Selecionar membros'}
                  </span>
                  <button
                    onClick={toggleTodos}
                    className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                  >
                    {selecionados.length === membroNaoAdicionados.length && membroNaoAdicionados.length > 0 ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>

                {/* Lista de membros com checkboxes */}
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
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                        }`}>
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
                          {m.funcoes?.[0] && (
                            <span className="text-[10px] text-blue-400">{m.funcoes[0].nome}</span>
                          )}
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
      </div>

    </div>
  );
}

export default EscalaDetalhe;
