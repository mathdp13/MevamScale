import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
const agora = new Date();

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
  if (dow === 0) return { hora: '10h' };
  if (dow === 3) return { hora: '20h' };
  return null;
}

function MinisterioPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [escalas, setEscalas] = useState([]);
  const [nomeMinisterio, setNomeMinisterio] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [ministerioAberto, setMinisterioAberto] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await api.get(`/agenda/geral?mes=${mes}&ano=${ano}&ministerioId=${id}`);
        setEscalas(res.data);
        if (res.data.length > 0 && !nomeMinisterio) {
          setNomeMinisterio(res.data[0].ministerio_nome);
        }
      } catch {}
    };
    const buscarNome = async () => {
      if (nomeMinisterio) return;
      try {
        const res = await api.get(`/ministerios/${id}`);
        setNomeMinisterio(res.data.nome);
      } catch {}
    };
    buscar();
    buscarNome();
    setDiaSelecionado(null);
    setMinisterioAberto(null);
  }, [mes, ano, id]);

  const navegarMes = (dir) => {
    setMes((m) => {
      const novo = m + dir;
      if (novo < 1) { setAno((a) => a - 1); return 12; }
      if (novo > 12) { setAno((a) => a + 1); return 1; }
      return novo;
    });
  };

  const escalasPorDia = escalas.reduce((acc, e) => {
    const d = parseInt(e.data_evento.split('T')[0].split('-')[2], 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  const dias = buildCalendar(mes, ano);
  const dataHoje = new Date();
  const ehMesAtual = mes === dataHoje.getMonth() + 1 && ano === dataHoje.getFullYear();
  const diaHojeNum = dataHoje.getDate();
  const escalasDodia = diaSelecionado ? (escalasPorDia[diaSelecionado] || []) : [];
  const tipoSelecionado = diaSelecionado ? getTipoEvento(diaSelecionado, mes, ano) : null;

  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      <div className="border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-sm font-bold tracking-tighter text-blue-400">
            {nomeMinisterio || 'Ministerio'}
          </span>
          <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase mt-0.5">Mevam Scale</p>
        </div>
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

      <main className="p-6 lg:p-10 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navegarMes(-1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm w-32 text-center">{MESES[mes - 1]} {ano}</span>
          <button onClick={() => navegarMes(1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <ChevronRight size={18} />
          </button>
        </div>

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
              const isLastRow = i >= dias.length - 7;
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
                      {tipo && <span className="text-[8px] text-blue-500 font-bold mt-0.5">{tipo.hora}</span>}
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
              {String(diaSelecionado).padStart(2, '0')}/{String(mes).padStart(2, '0')} · Culto às {tipoSelecionado?.hora}
            </p>

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
                <p className="text-gray-600 text-sm">Nenhuma escala para este dia.</p>
              </div>
            )}
          </div>
        )}

        {escalas.length === 0 && (
          <p className="text-gray-600 italic text-sm mt-4">Nenhuma escala em {MESES[mes - 1]}.</p>
        )}
      </main>
    </div>
  );
}

export default MinisterioPublico;
