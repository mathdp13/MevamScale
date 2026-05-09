import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    if (user.superadmin) carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios/todos');
      setUsuarios(res.data);
    } catch {
      toast.error('Erro ao carregar usuarios.');
    }
  };

  const togglePodeSlides = async (u) => {
    try {
      await api.put(`/usuarios/${u.id}/permissoes`, { pode_slides: !u.pode_slides });
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, pode_slides: !x.pode_slides } : x));
    } catch {
      toast.error('Erro ao atualizar permissao.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tighter text-white">
            {saudacao()}, {user.nome?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 text-xs mt-1 font-mono tracking-widest uppercase">
            Mevam Scale
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Atalhos */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/agenda')}
              className="bg-[#0a1a33] border border-white/5 hover:border-blue-500/30 rounded-2xl px-4 py-3 flex items-center justify-between transition-all group"
            >
              <span className="text-sm font-bold group-hover:text-blue-400 transition-colors">Ver agenda</span>
              <ChevronRight size={14} className="text-gray-700 group-hover:text-blue-400 transition-colors" />
            </button>
            <button
              onClick={() => navigate('/ministerios')}
              className="bg-[#0a1a33] border border-white/5 hover:border-blue-500/30 rounded-2xl px-4 py-3 flex items-center justify-between transition-all group"
            >
              <span className="text-sm font-bold group-hover:text-blue-400 transition-colors">Meus ministerios</span>
              <ChevronRight size={14} className="text-gray-700 group-hover:text-blue-400 transition-colors" />
            </button>
          </div>

          {/* Gestao de acesso — apenas superadmin */}
          {user.superadmin && (
            <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
              <h2 className="text-sm font-bold text-white mb-4">Gestao de Acesso</h2>
              <div className="space-y-2">
                {usuarios.filter((u) => !u.superadmin).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                      {u.foto_url ? (
                        <img src={u.foto_url} alt={u.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                          {u.nome?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.nome}</p>
                      <p className="text-[10px] text-gray-600 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => togglePodeSlides(u)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                        u.pode_slides
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-white/5 text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      {u.pode_slides ? 'Slides ativo' : 'Slides off'}
                    </button>
                  </div>
                ))}
                {usuarios.filter((u) => !u.superadmin).length === 0 && (
                  <p className="text-gray-600 text-sm italic">Nenhum usuario cadastrado.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default Home;
