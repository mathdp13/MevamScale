import { useState, useEffect } from 'react';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const agora = new Date();

function cacheKey(userId, mes, ano) {
  return `agenda_${userId}_${mes}_${ano}`;
}

function lerCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? []; } catch { return []; }
}

function Agenda() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [eventos, setEventos] = useState(() => lerCache(cacheKey(user.id, agora.getMonth() + 1, agora.getFullYear())));

  const carregarAgenda = async (m, a) => {
    const key = cacheKey(user.id, m, a);
    try {
      const res = await api.get(`/agenda?usuarioId=${user.id}&mes=${m}&ano=${a}`);
      setEventos(res.data);
      localStorage.setItem(key, JSON.stringify(res.data));
    } catch {
      toast.error('Erro ao carregar agenda.');
    }
  };

  useEffect(() => {
    if (!user.id) return;
    setEventos(lerCache(cacheKey(user.id, mes, ano)));
    carregarAgenda(mes, ano);
  }, [mes, ano]);

  const navegarMes = (dir) => {
    setMes((m) => {
      const novo = m + dir;
      if (novo < 1) { setAno((a) => a - 1); return 12; }
      if (novo > 12) { setAno((a) => a + 1); return 1; }
      return novo;
    });
  };

  const confirmar = async (evento) => {
    try {
      await api.put(`/escalas/${evento.id}/membros/${user.id}/confirmar`, {
        confirmado: !evento.confirmado,
      });
      setEventos((prev) => {
        const atualizados = prev.map((e) => e.id === evento.id ? { ...e, confirmado: !e.confirmado } : e);
        localStorage.setItem(cacheKey(user.id, mes, ano), JSON.stringify(atualizados));
        return atualizados;
      });
    } catch {
      toast.error('Erro ao confirmar presenca.');
    }
  };

  const formatarData = (data) => {
    if (!data) return { dia: '', mes: '' };
    const [, m, d] = data.split('T')[0].split('-');
    return { dia: d, mes: m };
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <Toaster />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tighter text-blue-400">Agenda</h1>
          <p className="text-gray-600 font-mono text-xs mt-1 tracking-widest uppercase">Seus proximos eventos</p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navegarMes(-1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm w-32 text-center">{MESES[mes - 1]} {ano}</span>
          <button onClick={() => navegarMes(1)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="space-y-3 max-w-2xl">
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
                    {e.ministerio_nome}
                    {e.funcao_nome && ` · ${e.funcao_nome}`}
                  </p>
                </div>
                <button
                  onClick={() => confirmar(e)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 flex-shrink-0 ${
                    e.confirmado
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {e.confirmado ? 'Confirmado' : 'Confirmar'}
                </button>
              </div>
            );
          })}
          {eventos.length === 0 && (
            <p className="text-gray-600 italic text-sm">Nenhum evento em {MESES[mes - 1]}.</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default Agenda;
