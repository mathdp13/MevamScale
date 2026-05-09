import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
const agora = new Date();

function cacheKey(tipo, id, mes, ano) {
  return `agenda_${tipo}_${id}_${mes}_${ano}`;
}

function lerCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? []; } catch { return []; }
}

function formatarData(data) {
  if (!data) return { dia: '', mes: '' };
  const [, m, d] = data.split('T')[0].split('-');
  return { dia: d, mes: m };
}

function buildCalendar(mes, ano) {
  const firstDay = new Date(ano, mes - 1, 1).getDay();
  const totalDias = new Date(ano, mes, 0).getDate();
  const dias = [];
  for (let i = 0; i < firstDay; i++) dias.push(null);
  for (let d = 1; d <= totalDias; d++) dias.push(d);
  return dias;
}

function getTipoEvento(dia, mes, ano) {
  if (!dia) return null;
  const dow = new Date(ano, mes - 1, dia).getDay();
  if (dow === 0) return { label: 'Culto', hora: '10h' };
  if (dow === 3) return { label: 'Culto', hora: '20h' };
  return null;
}

function Calendario({ escalas, mes, ano, mesLabel }) {
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [ministerioAberto, setMinisterioAberto] = useState(null);
  const dataHoje = new Date();
  const ehMesAtual = mes === dataHoje.getMonth() + 1 && ano === dataHoje.getFullYear();
  const diaHojeNum = dataHoje.getDate();

  const escalasPorDia = escalas.reduce((acc, e) => {
    const d = parseInt(e.data_evento.split('T')[0].split('-')[2], 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  const dias = buildCalendar(mes, ano);

  const tipoHoje = getTipoEvento(diaHojeNum, mes, ano);
  const escalasHoje = escalasPorDia[diaHojeNum];
  const mostrarBannerHoje = ehMesAtual && tipoHoje && escalasHoje?.length > 0;

  const escalasDodia = diaSelecionado ? (escalasPorDia[diaSelecionado] || []) : [];
  const tipoSelecionado = diaSelecionado ? getTipoEvento(diaSelecionado, mes, ano) : null;

  useEffect(() => { setDiaSelecionado(null); setMinisterioAberto(null); }, [mes, ano]);

  return (
    <div className="max-w-lg">
      {mostrarBannerHoje && (
        <div className="mb-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            Hoje · {tipoHoje.hora}
          </p>
          <div className="space-y-2">
            {escalasHoje.map((e) => (
              <div key={e.id}>
                <p className="text-white text-sm font-semibold">{e.ministerio_nome}</p>
                <p className="text-gray-500 text-xs">
                  {e.membros?.map((mb) => mb.nome).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#0a1a33] rounded-2xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/5">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className={`text-center py-3 text-[10px] font-bold uppercase tracking-wider ${d === 'Dom' ? 'text-blue-500' : 'text-gray-600'}`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {dias.map((dia, i) => {
            const tipo = dia ? getTipoEvento(dia, mes, ano) : null;
            const temEscala = dia && !!escalasPorDia[dia];
            const selecionado = dia === diaSelecionado;
            const ehHoje = ehMesAtual && dia === diaHojeNum;
            const col = i % 7;
            const totalCols = 7;
            const isLastRow = i >= dias.length - totalCols;

            return (
              <div
                key={i}
                onClick={() => dia && tipo && setDiaSelecionado(selecionado ? null : dia)}
                className={[
                  'relative min-h-[52px] flex flex-col items-center justify-start pt-2 pb-1',
                  dia && tipo ? 'cursor-pointer' : '',
                  selecionado ? 'bg-blue-600/20' : dia && tipo ? 'hover:bg-white/5 transition-colors' : '',
                  col < 6 ? 'border-r border-white/5' : '',
                  !isLastRow ? 'border-b border-white/5' : '',
                ].filter(Boolean).join(' ')}
              >
                {dia && (
                  <>
                    <span className={[
                      'text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full',
                      ehHoje ? 'bg-blue-600 text-white' : tipo ? 'text-white' : 'text-gray-700',
                    ].join(' ')}>
                      {dia}
                    </span>
                    {tipo && (
                      <span className="text-[8px] text-blue-500 font-bold mt-0.5">{tipo.hora}</span>
                    )}
                    {temEscala && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {diaSelecionado && (
        <div className="mt-4">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-3">
            {String(diaSelecionado).padStart(2, '0')}/{String(mes).padStart(2, '0')} · {tipoSelecionado?.label} às {tipoSelecionado?.hora}
          </p>

          {/* Nivel 2: membros do ministerio selecionado */}
          {ministerioAberto ? (
            <div className="bg-[#0a1a33] rounded-2xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setMinisterioAberto(null)}
                className="w-full flex items-center gap-2 px-4 py-3 border-b border-white/5 text-left hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-500" />
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">{ministerioAberto.ministerio_nome}</span>
              </button>
              {ministerioAberto.membros?.length > 0 ? (
                <div className="px-4 py-3 space-y-3">
                  {ministerioAberto.membros.map((mb, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-400">{mb.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{mb.nome.split(' ')[0]}</p>
                        {mb.funcao && <p className="text-[10px] text-gray-600">{mb.funcao}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-gray-600 text-sm">Nenhum membro escalado.</p>
              )}
            </div>
          ) : escalasDodia.length > 0 ? (
            /* Nivel 1: lista de ministerios */
            <div className="space-y-2">
              {escalasDodia.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setMinisterioAberto(e)}
                  className="w-full bg-[#0a1a33] rounded-2xl border border-white/5 px-4 py-3 flex items-center justify-between hover:border-blue-500/30 transition-all group"
                >
                  <div className="text-left">
                    <p className="text-white text-sm font-bold group-hover:text-blue-400 transition-colors">{e.ministerio_nome}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">
                      {e.total_membros > 0
                        ? e.membros?.slice(0, 3).map((mb) => mb.nome.split(' ')[0]).join(', ') + (e.total_membros > 3 ? ` +${e.total_membros - 3}` : '')
                        : 'Sem membros escalados'}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-700 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-[#0a1a33] rounded-2xl border border-white/5 px-4 py-4">
              <p className="text-gray-600 text-sm">Nenhuma escala criada para este dia.</p>
            </div>
          )}
        </div>
      )}

      {escalas.length === 0 && (
        <p className="text-gray-600 italic text-sm mt-4">Nenhuma escala em {mesLabel}.</p>
      )}
    </div>
  );
}

function NavMes({ mes, ano, navegar }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={() => navegar(-1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
        <ChevronLeft size={18} />
      </button>
      <span className="text-white font-bold text-sm w-32 text-center">{MESES[mes - 1]} {ano}</span>
      <button onClick={() => navegar(1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Agenda() {
  const navigate = useNavigate();
  const logado = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [modo, setModo] = useState('minha');
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [eventos, setEventos] = useState(() => logado ? lerCache(cacheKey('pessoal', user.id, agora.getMonth() + 1, agora.getFullYear())) : []);
  const [escalasGerais, setEscalasGerais] = useState(() => lerCache(cacheKey('geral', 'all', agora.getMonth() + 1, agora.getFullYear())));
  const [showSub, setShowSub] = useState(null);
  const [motivoSub, setMotivoSub] = useState('');
  const [prazosAtivos, setPrazosAtivos] = useState([]);
  const [showAusencias, setShowAusencias] = useState(null);
  const [escalasMes, setEscalasMes] = useState([]);
  const [minhasAusencias, setMinhasAusencias] = useState([]);
  const [carregandoAus, setCarregandoAus] = useState(false);

  const carregarPrazos = async (m, a) => {
    if (!logado || !user.id) return;
    try {
      const resMin = await api.get(`/usuarios/${user.id}/ministerios`);
      const ministerios = resMin.data || [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const ativos = ministerios.filter((min) => {
        if (!min.dia_limite_ausencias) return false;
        const prazo = new Date(a, m - 1, min.dia_limite_ausencias, 23, 59, 59);
        return prazo >= hoje;
      });
      setPrazosAtivos(ativos.map((min) => ({ ministerio_id: min.id, ministerio_nome: min.nome, dia: min.dia_limite_ausencias })));
    } catch {}
  };

  const carregarMinha = async (m, a) => {
    const key = cacheKey('pessoal', user.id, m, a);
    try {
      const res = await api.get(`/agenda?usuarioId=${user.id}&mes=${m}&ano=${a}`);
      setEventos(res.data);
      localStorage.setItem(key, JSON.stringify(res.data));
    } catch {
      toast.error('Erro ao carregar agenda.');
    }
  };

  const carregarGeral = async (m, a) => {
    const key = cacheKey('geral', 'all', m, a);
    try {
      const res = await api.get(`/agenda/geral?mes=${m}&ano=${a}`);
      setEscalasGerais(res.data);
      localStorage.setItem(key, JSON.stringify(res.data));
    } catch {
      toast.error('Erro ao carregar agenda geral.');
    }
  };

  useEffect(() => {
    setEscalasGerais(lerCache(cacheKey('geral', 'all', mes, ano)));
    carregarGeral(mes, ano);
    if (logado && user.id) {
      setEventos(lerCache(cacheKey('pessoal', user.id, mes, ano)));
      carregarMinha(mes, ano);
      carregarPrazos(mes, ano);
    }
  }, [mes, ano]);

  const navegarMes = (dir) => {
    setMes((m) => {
      const novo = m + dir;
      if (novo < 1) { setAno((a) => a - 1); return 12; }
      if (novo > 12) { setAno((a) => a + 1); return 1; }
      return novo;
    });
  };

  const abrirAusencias = async (prazo) => {
    setShowAusencias(prazo);
    setCarregandoAus(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get(`/escalas?ministerioId=${prazo.ministerio_id}&mes=${mes}&ano=${ano}`),
        api.get(`/ausencias?ministerioId=${prazo.ministerio_id}&mes=${mes}&ano=${ano}`),
      ]);
      setEscalasMes(r1.data);
      setMinhasAusencias(r2.data.filter((a) => a.usuario_id === user.id));
    } catch {
      toast.error('Erro ao carregar escalas.');
    } finally {
      setCarregandoAus(false);
    }
  };

  const toggleAusencia = async (escala) => {
    const dataStr = escala.data_evento.split('T')[0];
    const existente = minhasAusencias.find((a) => a.data?.split('T')[0] === dataStr);
    try {
      if (existente) {
        await api.delete(`/ausencias/${existente.id}`);
        setMinhasAusencias((prev) => prev.filter((a) => a.id !== existente.id));
      } else {
        const res = await api.post('/ausencias', {
          usuario_id: user.id,
          ministerio_id: showAusencias.ministerio_id,
          data: dataStr,
        });
        setMinhasAusencias((prev) => [...prev, res.data]);
      }
    } catch {
      toast.error('Erro ao atualizar ausencia.');
    }
  };

  const pedirSubstituto = async () => {
    if (!showSub) return;
    try {
      await api.post('/substituicoes', {
        escala_id: showSub.id,
        solicitante_id: user.id,
        motivo: motivoSub.trim() || null,
      });
      toast.success('Pedido enviado ao admin!');
      setShowSub(null);
      setMotivoSub('');
    } catch {
      toast.error('Erro ao enviar pedido.');
    }
  };

  const confirmar = async (evento) => {
    try {
      await api.put(`/escalas/${evento.id}/membros/${user.id}/confirmar`, {
        confirmado: !evento.confirmado,
      });
      setEventos((prev) => {
        const atualizados = prev.map((e) => e.id === evento.id ? { ...e, confirmado: !e.confirmado } : e);
        localStorage.setItem(cacheKey('pessoal', user.id, mes, ano), JSON.stringify(atualizados));
        return atualizados;
      });
    } catch {
      toast.error('Erro ao confirmar presenca.');
    }
  };

  if (!logado) {
    return (
      <div className="min-h-screen bg-[#050b18] text-white">
        <Toaster />
        <div className="border-b border-white/5 px-6 py-4 flex justify-between items-center">
          <span className="text-lg font-bold tracking-tighter">
            MEVAM <span className="font-light opacity-50">SCALE</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/5 transition-all"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/registro')}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Criar conta
            </button>
          </div>
        </div>
        <main className="p-6 lg:p-10 max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-blue-400">Agenda</h1>
            <p className="text-gray-600 text-xs mt-1 font-mono tracking-widest uppercase">Escalas de todos os ministerios</p>
          </div>
          <NavMes mes={mes} ano={ano} navegar={navegarMes} />
          <Calendario key={`${mes}-${ano}`} escalas={escalasGerais} mes={mes} ano={ano} mesLabel={MESES[mes - 1]} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <Toaster />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-blue-400">Agenda</h1>
        </div>

        <div className="flex gap-1 mb-6 bg-[#0a1a33] p-1 rounded-2xl w-fit">
          {[{ key: 'minha', label: 'Minha Agenda' }, { key: 'geral', label: 'Agenda Geral' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setModo(key)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                modo === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <NavMes mes={mes} ano={ano} navegar={navegarMes} />

        {modo === 'minha' && (
          <div className="space-y-2 max-w-2xl">
            {prazosAtivos.map((p) => (
              <div key={p.ministerio_id} className="flex items-center gap-3 bg-orange-500/8 border border-orange-500/20 rounded-2xl px-4 py-3">
                <AlertCircle size={14} className="text-orange-400 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-orange-300">Prazo de indisponibilidade — {p.ministerio_nome}</p>
                  <p className="text-[10px] text-orange-500 mt-0.5">
                    Marque os dias que nao pode ate o dia {p.dia}/{String(mes).padStart(2, '0')}
                  </p>
                </div>
                <button
                  onClick={() => abrirAusencias(p)}
                  className="text-[10px] font-bold text-orange-300 border border-orange-500/30 px-3 py-1.5 rounded-xl hover:bg-orange-500/10 transition-colors flex-shrink-0"
                >
                  Marcar dias
                </button>
              </div>
            ))}
            {eventos.map((e) => {
              const { dia, mes: m } = formatarData(e.data_evento);
              return (
                <div key={e.id} className="bg-[#0a1a33] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-lg leading-none">{dia}</span>
                    <span className="text-blue-600 text-[10px] font-bold">/{m}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-sm truncate">{e.nome}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      {e.ministerio_nome}{e.funcao_nome && ` · ${e.funcao_nome}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => confirmar(e)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                        e.confirmado ? 'bg-green-600/20 text-green-400' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {e.confirmado ? 'Confirmado' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => { setShowSub(e); setMotivoSub(''); }}
                      className="text-gray-600 hover:text-orange-400 transition-colors"
                      title="Pedir substituto"
                    >
                      <AlertCircle size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
            {eventos.length === 0 && (
              <p className="text-gray-600 italic text-sm">Nenhum evento em {MESES[mes - 1]}.</p>
            )}
          </div>
        )}

        {modo === 'geral' && (
          <Calendario key={`${mes}-${ano}`} escalas={escalasGerais} mes={mes} ano={ano} mesLabel={MESES[mes - 1]} />
        )}
      </main>
      <BottomNav />

      {/* Modal: marcar disponibilidade */}
      {showAusencias && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Minha disponibilidade</h3>
                <p className="text-[10px] text-gray-600 mt-0.5">{showAusencias.ministerio_nome} · {MESES[mes - 1]} {ano}</p>
              </div>
              <button onClick={() => setShowAusencias(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {carregandoAus ? (
                <p className="text-gray-600 text-sm text-center py-4">Carregando...</p>
              ) : escalasMes.length === 0 ? (
                <p className="text-gray-600 text-sm italic py-2">Nenhuma escala neste mes.</p>
              ) : escalasMes.map((e) => {
                const dataStr = e.data_evento.split('T')[0];
                const [, em, ed] = dataStr.split('-');
                const ausente = minhasAusencias.some((a) => a.data?.split('T')[0] === dataStr);
                return (
                  <button
                    key={e.id}
                    onClick={() => toggleAusencia(e)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                      ausente ? 'bg-red-500/10 border-red-500/30' : 'bg-white/3 border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${ausente ? 'bg-red-500/20' : 'bg-blue-600/15'}`}>
                      <span className={`text-sm font-bold leading-none ${ausente ? 'text-red-400' : 'text-blue-400'}`}>{ed}</span>
                      <span className={`text-[9px] font-bold ${ausente ? 'text-red-600' : 'text-blue-600'}`}>/{em}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-white truncate">{e.nome}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                      ausente ? 'bg-red-500/20 text-red-400' : 'bg-green-500/15 text-green-400'
                    }`}>
                      {ausente ? 'Nao posso' : 'Disponivel'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-white/5">
              <p className="text-center text-[10px] text-gray-600">Toque num dia para alternar sua disponibilidade</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: pedir substituto */}
      {showSub && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-7 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-1">Pedir substituto</h3>
            <p className="text-gray-500 text-xs mb-5">{showSub.nome} · {showSub.ministerio_nome}</p>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none"
              rows={3}
              placeholder="Motivo (opcional)"
              value={motivoSub}
              onChange={(e) => setMotivoSub(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={pedirSubstituto}
                className="flex-grow bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Enviar pedido
              </button>
              <button
                onClick={() => { setShowSub(null); setMotivoSub(''); }}
                className="px-5 text-gray-500 hover:text-white transition-colors text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;
