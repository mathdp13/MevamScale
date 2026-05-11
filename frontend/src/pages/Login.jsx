import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { ChevronRight } from 'lucide-react';

const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_LONGO = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_NOME = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];

const VERSICULO_CACHE_KEY = 'mevam_versiculos';
const VERSICULO_TTL = 60 * 60 * 1000;

async function buscarVersiculos() {
  const cached = JSON.parse(localStorage.getItem(VERSICULO_CACHE_KEY) || 'null');
  if (cached && Date.now() - cached.ts < VERSICULO_TTL) return cached.data;
  const respostas = await Promise.allSettled([
    api.get('/versiculo-aleatorio'),
    api.get('/versiculo-aleatorio'),
    api.get('/versiculo-aleatorio'),
  ]);
  const data = respostas
    .filter(r => r.status === 'fulfilled' && r.value.data?.texto)
    .map(r => ({ type: 'versiculo', ...r.value.data }));
  if (data.length > 0) localStorage.setItem(VERSICULO_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  return data;
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const buscar = async () => {
      try {
        const hoje = new Date();
        const mes = hoje.getMonth() + 1;
        const ano = hoje.getFullYear();

        const [slidesRes, eventosFixosRes] = await Promise.allSettled([
          api.get('/slides-login'),
          api.get('/eventos-fixos'),
        ]);

        const slidesAdmin = slidesRes.status === 'fulfilled' ? slidesRes.value.data : [];
        const eventosFixos = eventosFixosRes.status === 'fulfilled' ? eventosFixosRes.value.data : [];

        const eventosFixosMapeados = eventosFixos.map((ev) => {
          const diasAte = ((ev.dia_semana - hoje.getDay()) + 7) % 7 || 7;
          const proxData = new Date(hoje);
          proxData.setDate(hoje.getDate() + diasAte);
          return { type: 'evento_fixo', ...ev, proxima_data: proxData };
        });

        const todos = [
          ...slidesAdmin.map((s) => ({ type: 'slide', ...s })),
          ...eventosFixosMapeados,
        ];

        if (todos.length > 0) {
          setCarouselItems(todos);
        } else {
          try {
            const versiculos = await buscarVersiculos();
            if (versiculos.length > 0) setCarouselItems(versiculos);
          } catch {}
        }
      } catch {}
    };
    buscar();
  }, []);

  useEffect(() => {
    if (carouselItems.length < 2) return;
    const t = setInterval(() => setCarouselIdx((i) => (i + 1) % carouselItems.length), 3000);
    return () => clearInterval(t);
  }, [carouselItems]);

  const handleAuthSuccess = (data, toastId) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    toast.success(`Bem vindo, ${data.user.nome}!`, { id: toastId });
    setTimeout(() => { navigate('/home'); }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Autenticando...', { style: { background: '#0a1a33', color: '#fff' } });
    try {
      const response = await api.post('/login', { email, senha });
      handleAuthSuccess(response.data, toastId);
    } catch {
      toast.error('E-mail ou senha invalidos!', { id: toastId });
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

  const item = carouselItems[carouselIdx] || null;

  const patternBg = {
    background: '#060d1f',
    backgroundImage: [
      'radial-gradient(ellipse at 50% 35%, rgba(14, 60, 140, 0.35) 0%, transparent 60%)',
      'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '100% 100%, 26px 26px',
  };

  return (
    <div className="min-h-screen bg-[#050b18] flex font-sans">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Lado esquerdo — carousel (apenas desktop) */}
      <div className="hidden lg:flex flex-col w-[55%] relative overflow-hidden bg-[#050b18]">
        {item ? (
          <div className="absolute inset-0 transition-all duration-700">
            {item.imagem_url ? (
              <img
                key={item.id}
                src={item.imagem_url}
                alt={item.titulo}
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div
                key={item.id || item.nome}
                className="w-full h-full"
                style={patternBg}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0" style={patternBg} />
        )}

        <style>{`
          @keyframes verseFade {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .verse-enter { animation: verseFade 0.7s ease forwards; }
        `}</style>

        {/* Conteudo do slide */}
        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="text-white text-xl font-bold tracking-tighter">
            MEVAM <span className="font-light opacity-60">SCALE</span>
          </div>

          {item?.type === 'versiculo' ? (
            <div className="flex-grow flex items-center justify-center">
              <div key={carouselIdx} className="verse-enter text-center px-6 max-w-lg">
                <div className="w-10 h-px bg-blue-400/40 mx-auto mb-8" />
                <p className="text-white text-2xl font-black tracking-tight leading-snug italic mb-6">
                  &ldquo;{item.texto}&rdquo;
                </p>
                <p className="text-blue-400 text-sm font-bold tracking-widest uppercase">{item.ref}</p>
                <div className="w-10 h-px bg-blue-400/40 mx-auto mt-8" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-grow" />
              {item && (
                <div className="mb-8">
                  {item.type === 'evento' ? (
                    <>
                      <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
                        {(() => {
                          const d = new Date(item.data_evento.split('T')[0] + 'T12:00:00');
                          return `${DIAS_NOME[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} de ${MESES_LONGO[d.getMonth()]}`;
                        })()}
                      </div>
                      <h2 className="text-white text-3xl font-black tracking-tighter leading-tight mb-2">
                        {item.nome}
                      </h2>
                      {item.ministerio_nome && (
                        <p className="text-gray-400 text-sm font-bold">{item.ministerio_nome}</p>
                      )}
                    </>
                  ) : item.type === 'evento_fixo' ? (
                    <>
                      <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
                        {(() => {
                          const d = item.proxima_data;
                          return `${DIAS_NOME[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} de ${MESES_LONGO[d.getMonth()]}`;
                        })()}
                        {item.horario && ` — ${item.horario}`}
                      </div>
                      <h2 className="text-white text-3xl font-black tracking-tighter leading-tight mb-2">
                        {item.nome}
                      </h2>
                    </>
                  ) : (
                    <>
                      <h2 className="text-white text-3xl font-black tracking-tighter leading-tight mb-2">
                        {item.titulo}
                      </h2>
                      {item.subtitulo && (
                        <p className="text-gray-400 text-base">{item.subtitulo}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Dots */}
          {carouselItems.length > 1 && (
            <div className="flex gap-2">
              {carouselItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === carouselIdx ? 'w-6 bg-blue-400' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lado direito — formulario */}
      <div className="flex-grow lg:w-[45%] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-white text-3xl font-bold tracking-tighter">
              MEVAM <span className="font-light opacity-60">SCALE</span>
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="hidden lg:block bg-[#0a1a33] py-8 text-center">
              <h1 className="text-white text-2xl font-bold tracking-tighter">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
                <input
                  type="password"
                  className="w-full border-b-2 border-gray-100 p-2 focus:border-[#0a1a33] outline-none transition-all text-gray-700"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0a1a33] text-white font-bold py-4 rounded-xl hover:bg-[#112a52] transition-all shadow-lg active:scale-95"
              >
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
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Nao tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/registro')}
                    className="text-[#0a1a33] font-bold hover:underline underline-offset-4"
                  >
                    Se registre aqui
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* Banner mobile — slide ou proximo evento */}
          {item && (
            <div className="lg:hidden mt-4">
              {item.type === 'slide' ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={item.titulo} className="w-full h-36 object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-[#0a1a33] via-[#0d2347] to-[#050b18]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm leading-tight">{item.titulo}</p>
                    {item.subtitulo && <p className="text-gray-400 text-xs mt-0.5">{item.subtitulo}</p>}
                  </div>
                  {carouselItems.length > 1 && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      {carouselItems.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCarouselIdx(i)}
                          className={`h-1 rounded-full transition-all ${i === carouselIdx ? 'w-4 bg-white' : 'w-1 bg-white/30'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : item.type === 'evento_fixo' ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={item.nome} className="w-full h-36 object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-[#0a1a33] via-[#0d2347] to-[#050b18]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                      {DIAS_NOME[item.proxima_data.getDay()]}{item.horario ? ` — ${item.horario}` : ''}
                    </p>
                    <p className="text-white font-bold text-sm leading-tight">{item.nome}</p>
                  </div>
                </div>
              ) : item.type === 'versiculo' ? (
                <div className="bg-[#0a1a33]/80 border border-white/10 rounded-2xl px-5 py-4">
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">{item.ref}</p>
                  <p className="text-white text-xs italic leading-relaxed">&ldquo;{item.texto}&rdquo;</p>
                </div>
              ) : (
                <div className="bg-[#0a1a33]/80 border border-white/10 rounded-2xl px-5 py-4">
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">
                    Proximo evento
                  </p>
                  <p className="text-white font-bold text-sm">
                    {(() => {
                      const d = new Date(item.data_evento.split('T')[0] + 'T12:00:00');
                      return `${DIAS_NOME[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${MESES_CURTO[d.getMonth()]}`;
                    })()}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.nome}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
