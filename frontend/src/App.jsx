import { useState } from 'react';
import api from './services/api';

function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', { email, senha });
      localStorage.setItem('token', response.data.token);
      alert("Login realizado!");
    } catch (error) {
      alert("Erro ao logar!");
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Profissional */}
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

          <button 
            type="submit"
            className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-xl hover:bg-[#112a52] transition-all shadow-lg active:scale-95 mt-4"
          >
            ENTRAR
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;