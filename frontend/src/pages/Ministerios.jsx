import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import { toast, Toaster } from 'react-hot-toast';
import { Plus, X, ChevronRight } from 'lucide-react';
import OnboardingMinisterio from '../components/OnboardingMinisterio';

function Ministerios() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [ministerios, setMinisterios] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ministerios_cache') || '[]'); } catch { return []; }
  });
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [showModalEntrar, setShowModalEntrar] = useState(false);
  const [nomeMinisterio, setNomeMinisterio] = useState('');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [onboardingMinisterioId, setOnboardingMinisterioId] = useState(null);

  const carregarMinisterios = async () => {
    try {
      const res = await api.get(`/usuarios/${user.id}/ministerios`);
      setMinisterios(res.data);
      localStorage.setItem('ministerios_cache', JSON.stringify(res.data));
    } catch {}
  };

  useEffect(() => {
    if (user.id) carregarMinisterios();
  }, []);

  const handleCriar = async () => {
    if (!nomeMinisterio) return toast.error('Digite um nome para o ministerio!');
    try {
      await api.post('/ministerios', { nome: nomeMinisterio, lider_id: user.id });
      toast.success(`Ministerio "${nomeMinisterio}" criado!`);
      setShowModalCriar(false);
      setNomeMinisterio('');
      carregarMinisterios();
    } catch {
      toast.error('Erro ao criar o ministerio!');
    }
  };

  const handleEntrar = async () => {
    if (!codigoAcesso) return toast.error('Digite o codigo do ministerio!');
    try {
      const res = await api.post('/ministerios/entrar', {
        codigo: codigoAcesso.toUpperCase(),
        usuario_id: user.id,
      });
      setShowModalEntrar(false);
      setCodigoAcesso('');
      carregarMinisterios();
      setOnboardingMinisterioId(res.data.ministerioId);
    } catch {
      toast.error('Codigo invalido ou você ja faz parte desse ministerio!');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <Toaster />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10 max-w-3xl lg:max-w-none">

        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-white">Ministerios</h1>
            <p className="text-gray-600 text-xs mt-1 font-mono tracking-widest uppercase">
              {ministerios.length} {ministerios.length === 1 ? 'ministerio' : 'ministerios'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModalEntrar(true)}
              className="border border-white/10 px-3 py-2 rounded-xl font-bold hover:bg-white/5 transition-all text-xs text-gray-400"
            >
              Entrar com Codigo
            </button>
            <button
              onClick={() => setShowModalCriar(true)}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-1"
            >
              <Plus size={13} /> Criar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ministerios.map((min) => (
            <div
              key={min.id}
              onClick={() => navigate(`/ministerio/${min.id}`)}
              className="bg-[#0a1a33] px-4 py-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-sm group-hover:text-blue-400 transition-colors">{min.nome}</p>
                <p className="text-gray-600 text-[10px] font-mono mt-0.5">{min.codigo_acesso}</p>
              </div>
              <ChevronRight size={14} className="text-gray-700 group-hover:text-blue-400 transition-colors" />
            </div>
          ))}
          {ministerios.length === 0 && (
            <p className="text-gray-600 italic text-sm col-span-3">Você ainda nao participa de nenhum ministerio.</p>
          )}
        </div>
      </main>

      <BottomNav />

      {showModalCriar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-7 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Novo Ministerio</h3>
              <button onClick={() => setShowModalCriar(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <input
              className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm mb-6"
              placeholder="Nome do Ministerio"
              value={nomeMinisterio}
              onChange={(e) => setNomeMinisterio(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
              autoFocus
            />
            <button onClick={handleCriar} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95">
              Criar
            </button>
          </div>
        </div>
      )}

      {showModalEntrar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-7 border border-white/10 text-center">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Entrar com Codigo</h3>
              <button onClick={() => setShowModalEntrar(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <input
              className="w-full bg-transparent border-b border-gray-700 py-3 outline-none focus:border-blue-500 transition-colors text-white font-mono text-2xl text-center tracking-widest uppercase mb-6"
              placeholder="---"
              value={codigoAcesso}
              onChange={(e) => setCodigoAcesso(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEntrar()}
              autoFocus
            />
            <button onClick={handleEntrar} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95">
              Entrar
            </button>
          </div>
        </div>
      )}

      {onboardingMinisterioId && (
        <OnboardingMinisterio
          ministerioId={onboardingMinisterioId}
          onConcluir={() => {
            setOnboardingMinisterioId(null);
            carregarMinisterios();
          }}
        />
      )}
    </div>
  );
}

export default Ministerios;
