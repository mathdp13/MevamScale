import { useState } from 'react';
import api from './services/api';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Autenticando...', {
      style: { background: '#0a1a33', color: '#fff' }
    });

    try {
      const response = await api.post('/login', { email, senha });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success(`Bem-vindo, ${response.data.user.nome}!`, { id: toastId });

      setTimeout(() => {
        if (response.data.user.onboardingDone) {
          navigate('/escalas');
        } else {
          navigate('/questionario');
        }
      }, 1000);
    } catch (error) {
      toast.error("E-mail ou senha inválidos!", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-4 font-sans">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0a1a33] py-10 text-center">
          <h1 className="text-white text-3xl font-bold tracking-tighter">
            MEVAM <span className="font-light opacity-70">SANTANA</span>
          </h1>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
            <input 
              type="email" 
              className="w-full border-b-2 border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700"
              placeholder="Digite seu e-mail"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
            <input 
              type="password" 
              className="w-full border-b-2 border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700"
              placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-xl hover:bg-[#112a52] transition-all shadow-lg active:scale-95 mt-4">
            ENTRAR
          </button>
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Não tem uma conta?{' '}
              <button type="button" onClick={() => navigate('/registro')} className="text-[#0a1a33] font-bold hover:underline underline-offset-4">
                se registre aqui
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;