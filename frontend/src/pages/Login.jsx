import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { ChevronRight } from 'lucide-react';

const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS_NOME = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

function proximoEventoData() {
  const hoje = new Date();
  const dow = hoje.getDay();
  const candidatos = [
    { dia_semana: 0, hora: '10h' },
    { dia_semana: 3, hora: '20h' },
  ];
  let melhor = null;
  let minDias = Infinity;
  for (const c of candidatos) {
    let dias = c.dia_semana - dow;
    if (dias < 0) dias += 7;
    if (dias < minDias) {
      minDias = dias;
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + dias);
      melhor = { data, hora: c.hora };
    }
  }
  return melhor;
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [proximoEvento, setProximoEvento] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      const prox = proximoEventoData();
      if (!prox) return;
      const mes = prox.data.getMonth() + 1;
      const ano = prox.data.getFullYear();
      const diaNum = prox.data.getDate();
      try {
        const res = await api.get(`/agenda/geral?mes=${mes}&ano=${ano}`);
        const escalasDodia = res.data.filter((e) => {
          const d = parseInt(e.data_evento.split('T')[0].split('-')[2], 10);
          return d === diaNum;
        });
        if (escalasDodia.length > 0) {
          setProximoEvento({
            data: prox.data,
            hora: prox.hora,
            ministerios: escalasDodia.map((e) => e.ministerio_nome),
          });
        }
      } catch {}
    };
    buscar();
  }, []);

  const handleAuthSuccess = (data, toastId) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    toast.success(`Bem vindo, ${data.user.nome}!`, { id: toastId });
    setTimeout(() => { navigate('/home'); }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Autenticando...', {
      style: { background: '#0a1a33', color: '#fff' },
    });
    try {
      const response = await api.post('/login', { email, senha });
      handleAuthSuccess(response.data, toastId);
    } catch {
      toast.error('E-mail ou senha inválidos!', { id: toastId });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const toastId = toast.loading('Autenticando com o Google...');
    try {
      const response = await api.post('/login/google', { token: credentialResponse.credential });
      handleAuthSuccess(response.data, toastId);
    } catch {
      toast.error('Erro ao autenticar com o Google.', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center p-4 gap-4 font-sans">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0a1a33] py-10 text-center">
          <h1 className="text-white text-3xl font-bold tracking-tighter">
            MEVAM <span className="font-light opacity-70">SCALE</span>
          </h1>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
            <input
              type="email"
              className="w-full border-b-2 border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700"
              placeholder="Digite seu e-mail"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
            <input
              type="password"
              className="w-full border-b-2 border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700"
              placeholder="••••••••"
              value={senha} onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-xl hover:bg-[#112a52] transition-all shadow-lg active:scale-95 mt-4">
            ENTRAR
          </button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-bold tracking-widest">OU</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Erro ao se autenticar com o Google!')}
            />
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Não tem uma conta?{' '}
              <button type="button" onClick={() => navigate('/registro')} className="text-[#0a1a33] font-bold hover:underline underline-offset-4">
                Se registre aqui
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Card do proximo evento */}
      {proximoEvento && (
        <button
          onClick={() => navigate('/agenda')}
          className="w-full max-w-sm bg-[#0a1a33]/80 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-blue-500/30 transition-all group"
        >
          <div className="text-left">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">
              Próximo evento
            </p>
            <p className="text-white font-bold text-sm">
              {DIAS_NOME[proximoEvento.data.getDay()]},{' '}
              {String(proximoEvento.data.getDate()).padStart(2, '0')}{' '}
              {MESES_CURTO[proximoEvento.data.getMonth()]} · {proximoEvento.hora}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-700 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>
      )}

      {!proximoEvento && (
        <button
          onClick={() => navigate('/agenda')}
          className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
        >
          Ver agenda geral
        </button>
      )}
    </div>
  );
}

export default Login;
