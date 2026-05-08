import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, RefreshCw, X } from 'lucide-react';
import EscalaDetalhe from './EscalaDetalhe';

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];

function EscalasTab({ ministerioId, isAdmin, membros, funcoes }) {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [escalas, setEscalas] = useState([]);
  const [tiposCulto, setTiposCulto] = useState([]);
  const [escalaSelecionada, setEscalaSelecionada] = useState(null);

  const [showNovaEscala, setShowNovaEscala] = useState(false);
  const [showTiposCulto, setShowTiposCulto] = useState(false);
  const [novaEscala, setNovaEscala] = useState({ nome: '', data_evento: '', data_ensaio: '', tipo_culto_id: '' });
  const [novoTipo, setNovoTipo] = useState({ nome: '', dia_semana: '' });
  const [gerando, setGerando] = useState(false);

  const carregarEscalas = async () => {
    try {
      const res = await api.get(`/escalas?ministerioId=${ministerioId}&mes=${mes}&ano=${ano}`);
      setEscalas(res.data);
    } catch {
      toast.error('Erro ao carregar escalas.');
    }
  };

  const carregarTiposCulto = async () => {
    try {
      const res = await api.get(`/ministerios/${ministerioId}/tipos-culto`);
      setTiposCulto(res.data);
    } catch {}
  };

  useEffect(() => {
    carregarEscalas();
  }, [mes, ano, ministerioId]);

  useEffect(() => {
    carregarTiposCulto();
  }, [ministerioId]);

  const navegarMes = (dir) => {
    setMes((m) => {
      const novo = m + dir;
      if (novo < 1) { setAno((a) => a - 1); return 12; }
      if (novo > 12) { setAno((a) => a + 1); return 1; }
      return novo;
    });
  };

  const criarEscala = async () => {
    if (!novaEscala.nome.trim() || !novaEscala.data_evento) return toast.error('Nome e data sao obrigatorios.');
    try {
      await api.post('/escalas', {
        ministerioId,
        nome: novaEscala.nome,
        data_evento: novaEscala.data_evento,
        data_ensaio: novaEscala.data_ensaio || null,
        tipo_culto_id: novaEscala.tipo_culto_id || null,
      });
      toast.success('Escala criada!');
      setShowNovaEscala(false);
      setNovaEscala({ nome: '', data_evento: '', data_ensaio: '', tipo_culto_id: '' });
      carregarEscalas();
    } catch {
      toast.error('Erro ao criar escala.');
    }
  };

  const deletarEscala = async (escalaId) => {
    try {
      await api.delete(`/escalas/${escalaId}`);
      carregarEscalas();
    } catch {
      toast.error('Erro ao remover escala.');
    }
  };

  const gerarMes = async () => {
    setGerando(true);
    try {
      const res = await api.post('/escalas/gerar-mes', { ministerioId, mes, ano });
      toast.success(`${res.data.length} escalas geradas!`);
      carregarEscalas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Nenhum tipo recorrente configurado.');
    } finally {
      setGerando(false);
    }
  };

  const criarTipoCulto = async () => {
    if (!novoTipo.nome.trim()) return toast.error('Nome obrigatorio.');
    try {
      await api.post(`/ministerios/${ministerioId}/tipos-culto`, {
        nome: novoTipo.nome,
        dia_semana: novoTipo.dia_semana !== '' ? Number(novoTipo.dia_semana) : null,
      });
      setNovoTipo({ nome: '', dia_semana: '' });
      carregarTiposCulto();
    } catch {
      toast.error('Erro ao criar tipo de culto.');
    }
  };

  const deletarTipoCulto = async (id) => {
    try {
      await api.delete(`/ministerios/${ministerioId}/tipos-culto/${id}`);
      carregarTiposCulto();
    } catch {
      toast.error('Erro ao remover tipo.');
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    const [a, m, d] = data.split('T')[0].split('-');
    return `${d}/${m}`;
  };

  return (
    <div>
      {/* Cabecalho do mes */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navegarMes(-1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm w-32 text-center">{MESES[mes - 1]} {ano}</span>
          <button onClick={() => navegarMes(1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <ChevronRight size={18} />
          </button>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowTiposCulto(true)}
              className="text-xs font-bold text-gray-500 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
            >
              Recorrentes
            </button>
            <button
              onClick={gerarMes}
              disabled={gerando}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
            >
              <RefreshCw size={13} /> Gerar mes
            </button>
            <button
              onClick={() => setShowNovaEscala(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <Plus size={14} /> Nova escala
            </button>
          </div>
        )}
      </div>

      {/* Lista de escalas */}
      <div className="space-y-3 max-w-2xl">
        {escalas.map((e) => (
          <div
            key={e.id}
            onClick={() => setEscalaSelecionada(e)}
            className="bg-[#0a1a33] p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-lg leading-none">{formatarData(e.data_evento).split('/')[0]}</span>
              <span className="text-blue-600 text-[10px] font-bold">/{formatarData(e.data_evento).split('/')[1]}</span>
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-bold text-sm truncate">{e.nome}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">
                {e.total_membros} {e.total_membros === 1 ? 'membro' : 'membros'}
                {e.data_ensaio && ` · Ensaio ${formatarData(e.data_ensaio)}`}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={(ev) => { ev.stopPropagation(); deletarEscala(e.id); }}
                className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
        {escalas.length === 0 && (
          <p className="text-gray-600 italic text-sm">Nenhuma escala em {MESES[mes - 1]}.</p>
        )}
      </div>

      {/* Modal: Nova escala */}
      {showNovaEscala && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-7 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Nova Escala</h3>
              <button onClick={() => setShowNovaEscala(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Nome</label>
                <input
                  className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm"
                  placeholder="Ex: Culto de Domingo"
                  value={novaEscala.nome}
                  onChange={(e) => setNovaEscala({ ...novaEscala, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Data do Evento</label>
                <input
                  type="date"
                  className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm"
                  value={novaEscala.data_evento}
                  onChange={(e) => setNovaEscala({ ...novaEscala, data_evento: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Data do Ensaio (opcional)</label>
                <input
                  type="date"
                  className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm"
                  value={novaEscala.data_ensaio}
                  onChange={(e) => setNovaEscala({ ...novaEscala, data_ensaio: e.target.value })}
                />
              </div>
            </div>
            <button onClick={criarEscala} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95">
              Criar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Tipos de culto recorrentes */}
      {showTiposCulto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-7 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Cultos Recorrentes</h3>
              <button onClick={() => setShowTiposCulto(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {tiposCulto.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-white">{t.nome}</p>
                    {t.dia_semana !== null && (
                      <p className="text-[10px] text-gray-500">{DIAS[t.dia_semana]}</p>
                    )}
                  </div>
                  <button onClick={() => deletarTipoCulto(t.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {tiposCulto.length === 0 && <p className="text-gray-600 text-sm italic">Nenhum tipo cadastrado.</p>}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <input
                className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm"
                placeholder="Nome (ex: Culto de Domingo)"
                value={novoTipo.nome}
                onChange={(e) => setNovoTipo({ ...novoTipo, nome: e.target.value })}
              />
              <select
                className="w-full bg-[#050b18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                value={novoTipo.dia_semana}
                onChange={(e) => setNovoTipo({ ...novoTipo, dia_semana: e.target.value })}
              >
                <option value="">Sem recorrencia</option>
                {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <button onClick={criarTipoCulto} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalhe da escala */}
      {escalaSelecionada && (
        <EscalaDetalhe
          escala={escalaSelecionada}
          isAdmin={isAdmin}
          membros={membros}
          funcoes={funcoes}
          onFechar={() => setEscalaSelecionada(null)}
          onAtualizar={carregarEscalas}
        />
      )}
    </div>
  );
}

export default EscalasTab;
