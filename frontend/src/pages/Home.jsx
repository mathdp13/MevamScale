import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import OnboardingMinisterio from '../components/OnboardingMinisterio';

function Ministerios() {
  const navigate = useNavigate();
  const [meusMinisterios, setMeusMinisterios] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [showModalEntrar, setShowModalEntrar] = useState(false);
  const [nomeMinisterio, setNomeMinisterio] = useState('');
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [onboardingMinisterioId, setOnboardingMinisterioId] = useState(null);

  const carregarMinisterios = async () => {
    try {
      const res = await api.get(`/usuarios/${user.id}/ministerios`);
      setMeusMinisterios(res.data);  
    } catch (err) {
      console.error("Erro ao carregar os seus ministérios", err);
    }
  };

  useEffect(() => {
    carregarMinisterios();
  }, [user.id]);

  const handleCriar = async (e) => {
    if (!nomeMinisterio) return toast.error("Digite um nome para o ministério!");
    try {
      await api.post('/ministerios', { nome: nomeMinisterio, lider_id: user.id });
      toast.success(`O ministério "${nomeMinisterio}" foi criado com sucesso!`);
      setShowModalCriar(false);
      setNomeMinisterio('');
      carregarMinisterios();
    } catch (err) {
      toast.error("Erro ao criar o ministério!");
    }
  };

  const handleEntrar = async () => {
    if (!codigoAcesso) return toast.error("Digite o codigo do ministerio para entrar!");
    try {
      const res = await api.post('/ministerios/entrar', {
        codigo: codigoAcesso.toUpperCase(),
        usuario_id: user.id
      });
      setShowModalEntrar(false);
      setCodigoAcesso('');
      carregarMinisterios();
      setOnboardingMinisterioId(res.data.ministerioId);
    } catch {
      toast.error("Codigo invalido ou voce ja faz parte desse ministerio!");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />

      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">
    <header className="mb-10 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-blue-400">Meus Ministérios</h1>
         <p className="text-gray-500 text-sm">Selecione um ministério para ver as escalas e membros.</p>
     </div>
      <div className="flex gap-4">
        <button onClick={() => setShowModalEntrar(true)} className="border border-white/10 px-4 py-2 rounded-xl font-bold hover:bg-white/5 transition-all text-sm">
          Entrar com Código
        </button>
       <button onClick={() => setShowModalCriar(true)} className="bg-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm">
         + Criar Novo
       </button>
     </div>
    </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meusMinisterios.map((min) => (
            <div
              key={min.id}
              onClick={() => navigate(`/ministerio/${min.id}`)}
              className="bg-[#0a1a33] p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
            >
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400">{min.nome}</h3>
              <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                Código: {min.codigo_acesso}
              </p>
            </div>
          ))}

          {meusMinisterios.length === 0 && (
            <p className="text-gray-600 italic">Você ainda não participa de nenhum ministério.</p>
          )}
        </div>

        {showModalCriar && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-gray-900">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Novo Ministério</h3>
              <input className="w-full border-2 border-gray-100 p-4 rounded-xl mb-6 outline-none focus:border-blue-600 font-bold" placeholder="Nome do Ministério" value={nomeMinisterio} onChange={(e) => setNomeMinisterio(e.target.value)} />
              <button onClick={handleCriar} className="w-full bg-[#0a1a33] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Criar</button>
              <button onClick={() => setShowModalCriar(false)} className="w-full mt-4 text-gray-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        )}

        {showModalEntrar && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-gray-900">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl text-center">
              <h3 className="text-2xl font-bold mb-6">Digitar Código</h3>
              <input className="w-full border-2 border-gray-100 p-5 rounded-xl mb-6 outline-none focus:border-green-600 font-mono text-3xl text-center tracking-widest uppercase" placeholder="---" value={codigoAcesso} onChange={(e) => setCodigoAcesso(e.target.value)} />
              <button onClick={handleEntrar} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Validar Código</button>
              <button onClick={() => setShowModalEntrar(false)} className="w-full mt-4 text-gray-400 font-bold text-xs uppercase tracking-widest">Voltar</button>
            </div>
          </div>
        )}

      </main>

      <BottomNav />

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