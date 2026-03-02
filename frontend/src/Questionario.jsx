import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';

function Questionario() {
  const navigate = useNavigate();
  const [instrumento, setInstrumento] = useState('');
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleConcluir = async (e) => {
    e.preventDefault();
    if (!instrumento) return alert("Selecione sua função principal!");

    setLoading(true);
    try {
      await api.put('/usuarios/perfil', { 
        instrumento, 
        userId: user.id 
      });

      // Atualiza o status de onboarding no localStorage para ele não ver essa tela de novo
      const updatedUser = { ...user, onboardingDone: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert(`Perfil de ${instrumento} configurado!`);
      navigate('/escalas');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const funcoes = ['Guitarra', 'Baixo', 'Vocal', 'Teclado', 'Bateria', 'Som', 'Projeção', 'Ministro'];

  return (
    <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-[#0a1a33] text-2xl font-bold tracking-tighter">BEM-VINDO AO TIME!</h2>
          <p className="text-gray-500 text-sm">Selecione sua função principal no Worship.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {funcoes.map((item) => (
            <button
              key={item}
              onClick={() => setInstrumento(item)}
              className={`p-4 rounded-xl border-2 font-bold text-xs transition-all ${
                instrumento === item 
                ? 'border-[#0a1a33] bg-[#0a1a33] text-white shadow-lg' 
                : 'border-gray-100 text-gray-400 hover:border-gray-200'
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        <button 
          onClick={handleConcluir}
          disabled={loading || !instrumento}
          className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-[#112a52] transition-all active:scale-95 disabled:opacity-30 uppercase tracking-widest"
        >
          {loading ? "Salvando..." : "Concluir Perfil"}
        </button>
      </div>
    </div>
  );
}

export default Questionario;