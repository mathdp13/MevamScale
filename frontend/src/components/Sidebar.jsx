import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Início', icon: '🕒', path: '/home' },
    { label: 'Ministérios', icon: '⛪', path: '/ministerios' },
  ];

  return (
    <aside className="w-64 bg-[#0a1a33] h-screen flex flex-col border-r border-white/5 fixed left-0 top-0">
      {/* BOLINHA PERFIL */}
      <div 
        onClick={() => navigate('/perfil')}
        className="p-8 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-all">
          {user.nome?.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-white font-bold text-sm truncate">{user.nome}</p>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">Ver Perfil</p>
        </div>
      </div>

      {/* LINKS */}
      <nav className="flex-grow px-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-2"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* SAIR */}
      <div className="p-6 border-t border-white/5">
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }}
          className="w-full text-left text-xs font-bold text-gray-600 hover:text-red-400 transition-colors uppercase tracking-widest"
        >
          Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;