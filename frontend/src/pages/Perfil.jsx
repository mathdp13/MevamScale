import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

function Perfil() {
  const navigate = useNavigate();
  const [funcoesSelecionadas, setFuncoesSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const toggleFuncao = (item) => {
    if (funcoesSelecionadas.includes(item)) {
      setFuncoesSelecionadas(funcoesSelecionadas.filter(f => f !== item));
    } else {
      setFuncoesSelecionadas([...funcoesSelecionadas, item]);
    }
  };

  const handleConcluir = async (e) => {
    e.preventDefault();
    if (funcoesSelecionadas.length === 0) return toast.error("Selecione ao menos uma função!");

    const toastId = toast.loading('Configurando seu perfil...');
    setLoading(true);

    try {
      await api.post('/usuarios/skills', { 
        funcoes: funcoesSelecionadas,
        usuario_id: user.id
      });

      const updatedUser = { ...user, onboardingDone: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success("Perfil configurado com sucesso!", { id: toastId });
      
      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar perfil. Tente novamente.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const funcoes = ['Guitarra', 'Baixo', 'Teclado', 'Bateria', 'Violão',  'Vocal', 'Técnico de Som 🎛️'];

  return (
    <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-4 font-sans text-gray-800">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-[#0a1a33] text-2xl font-bold tracking-tighter uppercase">Bem-vindo ao Time!</h2>
          <p className="text-gray-400 text-xs mt-2 font-medium tracking-widest uppercase">
            Selecione suas funções!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {funcoes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleFuncao(item)}
              className={`p-4 rounded-xl border-2 font-bold text-[10px] transition-all duration-300 tracking-widest uppercase ${
                funcoesSelecionadas.includes(item) 
                ? 'border-[#0a1a33] bg-[#0a1a33] text-white shadow-xl scale-[1.02]' 
                : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <button 
          onClick={handleConcluir}
          disabled={loading || funcoesSelecionadas.length === 0}
          className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#112a52] transition-all active:scale-95 disabled:opacity-20 uppercase tracking-[0.2em] text-xs"
        >
          {loading ? "Processando..." : "Concluir Perfil"}
        </button>
      </div>
    </div>
  );
}

export default Perfil;