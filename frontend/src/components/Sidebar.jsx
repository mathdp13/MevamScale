import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Church, Calendar, LogOut } from 'lucide-react';
import api from '../services/api';

const menuItems = [
  { label: 'Inicio', icon: Home, path: '/home' },
  { label: 'Ministerios', icon: Church, path: '/ministerios' },
  { label: 'Agenda', icon: Calendar, path: '/agenda' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    const dadosLocal = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(dadosLocal);
    if (!dadosLocal.id || dadosLocal.foto_url) return;
    api.get(`/usuarios/${dadosLocal.id}`)
      .then((res) => {
        if (res.data.foto_url) {
          setUser((prev) => ({ ...prev, foto_url: res.data.foto_url }));
          try {
            localStorage.setItem('user', JSON.stringify({ ...dadosLocal, foto_url: res.data.foto_url }));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden lg:flex w-64 bg-[#0a1a33] h-screen flex-col border-r border-white/5 fixed left-0 top-0">
      <div
        onClick={() => navigate('/perfil')}
        className="p-8 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-all overflow-hidden border border-white/10 shrink-0">
          {user.foto_url ? (
            <img src={user.foto_url} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{user.nome?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="overflow-hidden">
          <p className="text-white font-bold text-sm truncate">{user.nome}</p>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">Ver Perfil</p>
        </div>
      </div>

      <nav className="flex-grow px-4 mt-4">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all mb-2 ${
              location.pathname === path
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={18} />
            <span className="font-bold text-sm">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={() => { localStorage.clear(); navigate('/'); }}
          className="w-full text-left text-xs font-bold text-gray-600 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <LogOut size={14} /> Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
