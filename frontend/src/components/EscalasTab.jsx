import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { ChevronLeft, ChevronRight, Plus, Trash2, RefreshCw, X, ImageDown, Settings, AlertCircle, Users } from 'lucide-react';
import EscalaDetalhe from './EscalaDetalhe';

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];

function lerCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? []; } catch { return []; }
}

function salvarCache(key, dados) {
  try { localStorage.setItem(key, JSON.stringify(dados)); } catch {}
}

function EscalasTab({ ministerioId, isAdmin, membros, funcoes }) {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [escalas, setEscalas] = useState(() => lerCache(`escalas_${ministerioId}_${agora.getMonth() + 1}_${agora.getFullYear()}`));
  const [tiposCulto, setTiposCulto] = useState(() => lerCache(`tipos_culto_${ministerioId}`));
  const [escalaSelecionada, setEscalaSelecionada] = useState(null);

  const [showNovaEscala, setShowNovaEscala] = useState(false);
  const [showTiposCulto, setShowTiposCulto] = useState(false);
  const [novaEscala, setNovaEscala] = useState({ nome: '', data_evento: '', data_ensaio: '', tipo_culto_id: '' });
  const [novoTipo, setNovoTipo] = useState({ nome: '', dia_semana: '' });
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [escalasExport, setEscalasExport] = useState([]);
  const [showConfigMes, setShowConfigMes] = useState(false);
  const [ausenciasMes, setAusenciasMes] = useState([]);
  const [configDiaLimite, setConfigDiaLimite] = useState('');
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [adicionandoFormacao, setAdicionandoFormacao] = useState(null);
  const [novaFormacao, setNovaFormacao] = useState({ funcao_id: '', quantidade: 1 });
  const tabelaRef = useRef(null);

  const carregarEscalas = async () => {
    try {
      const res = await api.get(`/escalas?ministerioId=${ministerioId}&mes=${mes}&ano=${ano}`);
      setEscalas(res.data);
      salvarCache(`escalas_${ministerioId}_${mes}_${ano}`, res.data);
    } catch {
      toast.error('Erro ao carregar escalas.');
    }
  };

  const carregarTiposCulto = async () => {
    try {
      const res = await api.get(`/ministerios/${ministerioId}/tipos-culto`);
      let tipos = res.data;

      if (tipos.length === 0 && isAdmin) {
        await Promise.all([
          api.post(`/ministerios/${ministerioId}/tipos-culto`, { nome: 'Culto de Domingo', dia_semana: 0 }),
          api.post(`/ministerios/${ministerioId}/tipos-culto`, { nome: 'Culto de Quarta', dia_semana: 3 }),
        ]);
        const res2 = await api.get(`/ministerios/${ministerioId}/tipos-culto`);
        tipos = res2.data;
      }

      setTiposCulto(tipos);
      salvarCache(`tipos_culto_${ministerioId}`, tipos);
    } catch {}
  };

  useEffect(() => {
    setEscalas(lerCache(`escalas_${ministerioId}_${mes}_${ano}`));
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

  const abrirConfigMes = async () => {
    setShowConfigMes(true);
    try {
      const [resMin, resAusencias] = await Promise.all([
        api.get(`/ministerios/${ministerioId}`),
        api.get(`/ausencias?ministerioId=${ministerioId}&mes=${mes}&ano=${ano}`),
      ]);
      setConfigDiaLimite(resMin.data?.dia_limite_ausencias ? String(resMin.data.dia_limite_ausencias) : '');
      setAusenciasMes(resAusencias.data || []);
    } catch {}
  };

  const salvarConfig = async () => {
    setSalvandoConfig(true);
    try {
      await api.put(`/ministerios/${ministerioId}`, {
        dia_limite_ausencias: configDiaLimite ? Number(configDiaLimite) : null,
      });
      toast.success('Prazo salvo!');
    } catch {
      toast.error('Erro ao salvar prazo.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  const gerarMesDoConfig = async () => {
    setGerando(true);
    try {
      const res = await api.post('/escalas/gerar-mes', { ministerioId, mes, ano });
      const { criadas, populadas } = res.data;
      const total = criadas + populadas;
      if (total === 0) {
        toast('Escalas do mes ja estao configuradas com membros.');
      } else if (criadas === 0) {
        toast.success(`Lineup aplicado a ${populadas} escala${populadas !== 1 ? 's' : ''}!`);
      } else {
        toast.success(`${criadas} escala${criadas !== 1 ? 's' : ''} criada${criadas !== 1 ? 's' : ''}, ${populadas} populada${populadas !== 1 ? 's' : ''} com lineup!`);
      }
      setShowConfigMes(false);
      carregarEscalas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Nenhum tipo recorrente configurado.');
    } finally {
      setGerando(false);
    }
  };

  const salvarFormacao = async (tipoCultoId) => {
    if (!novaFormacao.funcao_id) return;
    try {
      await api.post(`/ministerios/${ministerioId}/tipos-culto/${tipoCultoId}/formacao`, {
        funcao_id: Number(novaFormacao.funcao_id),
        quantidade: Number(novaFormacao.quantidade) || 1,
      });
      setAdicionandoFormacao(null);
      carregarTiposCulto();
    } catch {
      toast.error('Erro ao salvar formacao.');
    }
  };

  const removerFormacao = async (tipoCultoId, funcaoId) => {
    try {
      await api.delete(`/ministerios/${ministerioId}/tipos-culto/${tipoCultoId}/formacao/${funcaoId}`);
      carregarTiposCulto();
    } catch {
      toast.error('Erro ao remover formacao.');
    }
  };

  const exportarMesComDados = async () => {
    if (exportando) return;
    setExportando(true);
    try {
      const res = await api.get(`/agenda/geral?mes=${mes}&ano=${ano}&ministerioId=${ministerioId}`);
      const dados = res.data;
      if (dados.length === 0) { toast.error('Nenhuma escala para exportar.'); setExportando(false); return; }
      setEscalasExport(dados);
      await new Promise((r) => setTimeout(r, 200));
      const canvas = await html2canvas(tabelaRef.current, { backgroundColor: '#0a1a33', scale: 2 });
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escala-${MESES[mes - 1]}-${ano}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setEscalasExport([]);
    } catch {
      toast.error('Erro ao exportar.');
    } finally {
      setExportando(false);
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
    const [, m, d] = data.split('T')[0].split('-');
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
              onClick={abrirConfigMes}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
            >
              <Settings size={13} /> Configurar
            </button>
            <button
              onClick={exportarMesComDados}
              disabled={exportando}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5 disabled:opacity-40"
            >
              <ImageDown size={13} /> {exportando ? 'Gerando...' : 'Exportar'}
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

      {/* Modal: Configurar mes */}
      {showConfigMes && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Configurar {MESES[mes - 1]} {ano}</h3>
                <p className="text-[10px] text-gray-600 mt-0.5 font-mono">Painel de gestao do mes</p>
              </div>
              <button onClick={() => setShowConfigMes(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-5">
              {/* Prazo de indisponibilidade */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-2">
                  Prazo fixo (dia do mes)
                </label>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-500">Dia</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Ex: 15"
                    className="w-20 bg-[#050b18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center outline-none focus:border-blue-500 transition-colors"
                    value={configDiaLimite}
                    onChange={(e) => setConfigDiaLimite(e.target.value)}
                  />
                  <span className="text-sm text-gray-500">de cada mes</span>
                  <button
                    onClick={salvarConfig}
                    disabled={salvandoConfig}
                    className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
                  >
                    {salvandoConfig ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
                {configDiaLimite && (
                  <p className="text-[10px] text-blue-400 mt-1.5">
                    Membros devem registrar indisponibilidade ate o dia {configDiaLimite} de cada mes
                  </p>
                )}
              </div>

              {/* Indisponibilidades registradas */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-2">
                  Indisponibilidades do mes ({ausenciasMes.length})
                </label>
                {ausenciasMes.length === 0 ? (
                  <p className="text-gray-700 text-xs italic">Nenhuma registrada ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {ausenciasMes.map((a) => {
                      const [, am, ad] = (a.data || '').split('T')[0].split('-');
                      return (
                        <div key={a.id} className="flex items-center gap-2 bg-orange-500/5 border border-orange-500/10 rounded-xl px-3 py-2">
                          <AlertCircle size={12} className="text-orange-400 flex-shrink-0" />
                          <span className="text-xs text-white font-bold flex-grow truncate">{a.usuario_nome}</span>
                          <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">{ad}/{am}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lineup configurado */}
              {(() => {
                const lineup = membros.filter((m) => m.funcoes?.length > 0);
                return (
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-2">
                      Lineup configurado ({lineup.length} membros)
                    </label>
                    {lineup.length === 0 ? (
                      <p className="text-gray-700 text-xs italic">Nenhum membro com funcao definida. Configure na aba Membros.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {lineup.map((m) => (
                          <span key={m.id} className="bg-white/5 rounded-lg px-2 py-1 text-[10px] text-gray-300 font-bold">
                            {m.nome.split(' ')[0]}
                            {m.funcoes[0] && <span className="text-gray-600 font-normal"> · {m.funcoes[0].nome}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Botao gerar escalas */}
            <div className="p-6 border-t border-white/5 flex-shrink-0">
              <button
                onClick={gerarMesDoConfig}
                disabled={gerando}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className={gerando ? 'animate-spin' : ''} />
                {gerando ? 'Gerando...' : `Gerar escalas de ${MESES[mes - 1]}`}
              </button>
              <p className="text-center text-[10px] text-gray-600 mt-2">
                Cria os cultos do mes com o lineup acima, excluindo ausencias.
              </p>
            </div>
          </div>
        </div>
      )}

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

            <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
              {tiposCulto.map((t) => (
                <div key={t.id} className="bg-white/5 px-4 py-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
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

                  {/* Formacao */}
                  <div className="flex flex-wrap gap-1.5">
                    {(t.formacao || []).map((f) => (
                      <span key={f.funcao_id} className="flex items-center gap-1 bg-blue-600/15 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-lg">
                        {f.funcao_nome} ×{f.quantidade}
                        <button onClick={() => removerFormacao(t.id, f.funcao_id)} className="text-blue-600 hover:text-red-400 transition-colors ml-0.5">×</button>
                      </span>
                    ))}

                    {adicionandoFormacao?.tipoCultoId === t.id ? (
                      <div className="flex items-center gap-1.5 w-full mt-1">
                        <select
                          className="flex-grow bg-[#050b18] border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                          value={novaFormacao.funcao_id}
                          onChange={(e) => setNovaFormacao((prev) => ({ ...prev, funcao_id: e.target.value }))}
                        >
                          <option value="">Funcao...</option>
                          {funcoes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                        <input
                          type="number" min={1} max={10}
                          className="w-12 bg-[#050b18] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center outline-none"
                          value={novaFormacao.quantidade}
                          onChange={(e) => setNovaFormacao((prev) => ({ ...prev, quantidade: Number(e.target.value) }))}
                        />
                        <button onClick={() => salvarFormacao(t.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">OK</button>
                        <button onClick={() => setAdicionandoFormacao(null)} className="text-gray-500 hover:text-white text-xs px-1">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAdicionandoFormacao({ tipoCultoId: t.id }); setNovaFormacao({ funcao_id: '', quantidade: 1 }); }}
                        className="text-[10px] text-gray-600 hover:text-blue-400 transition-colors border border-dashed border-gray-700 hover:border-blue-500/50 px-2 py-1 rounded-lg"
                      >
                        + funcao
                      </button>
                    )}
                  </div>
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
          ministerioId={ministerioId}
          onFechar={() => setEscalaSelecionada(null)}
          onAtualizar={carregarEscalas}
        />
      )}

      {/* Tabela oculta para exportar como imagem */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
        <div
          ref={tabelaRef}
          style={{ background: '#0a1a33', padding: '32px', width: '600px', fontFamily: 'sans-serif', color: '#fff' }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: '#4a6fa5', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>
              {escalasExport[0]?.ministerio_nome || 'Ministerio'}  ·  MevamScale
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
              {MESES[mes - 1]} {ano}
            </div>
          </div>

          {escalasExport.map((ev, idx) => {
            const [, em, ed] = (ev.data_evento || '').split('T')[0].split('-');
            const membrosEv = ev.membros || [];
            return (
              <div key={ev.id} style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{
                  display: 'flex', gap: '16px', alignItems: 'center',
                  padding: '12px 0 8px',
                  borderBottom: membrosEv.length === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <div style={{ minWidth: '42px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px', textAlign: 'center', padding: '6px 4px', flexShrink: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{ed}</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#2563eb' }}>/{em}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{ev.nome}</div>
                </div>

                {membrosEv.map((mb, mi) => (
                  <div key={mi} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 0 5px 58px',
                    borderBottom: mi === membrosEv.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{mb.nome}</span>
                    {mb.funcao && (
                      <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 700, background: 'rgba(59,130,246,0.12)', borderRadius: '5px', padding: '2px 7px' }}>
                        {mb.funcao}
                      </span>
                    )}
                  </div>
                ))}
                {membrosEv.length === 0 && (
                  <div style={{ padding: '5px 0 5px 58px', fontSize: '12px', color: '#374151', fontStyle: 'italic', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    Sem membros
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EscalasTab;
