import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import toast, { Toaster } from 'react-hot-toast';

function Registro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    const loadId = toast.loading('Criando sua conta de voluntário...');

    try {

      await api.post('/usuarios', { nome, email, senha });
      
      toast.success("Cadastro realizado! Agora é só logar.", { id: loadId });
      
      setTimeout(() => {
        navigate('/'); // Volta para a tela de login após 2 segundos
      }, 2000);

    } catch (error) {
      toast.error("Erro ao cadastrar. Verifique os dados ou tente outro e-mail.", { id: loadId });
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-4 font-sans">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Identidade Mevam */}
        <div className="bg-[#0a1a33] py-8 text-center">
          <h2 className="text-white text-2xl font-bold tracking-tighter uppercase">Cadastro</h2>
          <p className="text-white/50 text-[10px] tracking-[0.2em]">Mevam Santana Scale</p>
        </div>

        <form onSubmit={handleRegistro} className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
            <input 
              required type="text" 
              className="w-full border-b border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700 text-sm"
              value={nome} onChange={e => setNome(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
            <input 
              required type="email" 
              className="w-full border-b border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700 text-sm"
              placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Senha</label>
            <input 
              required type="password" 
              className="w-full border-b border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700 text-sm"
              placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-xl hover:bg-[#112a52] transition-all shadow-lg active:scale-95 mt-4 text-xs"
          >
            FINALIZAR CADASTRO
          </button>

          <div className="text-center mt-4">
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="text-[11px] text-gray-400 hover:text-[#0a1a33] transition-colors font-medium"
            >
              Já possui conta? <span className="underline decoration-1 underline-offset-4">Fazer Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registro;