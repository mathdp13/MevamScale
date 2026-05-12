import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Church, Calendar, User, MonitorPlay } from 'lucide-react';

const MAIN_ITEMS = [
  { label: 'Inicio', icon: Home, path: '/home' },
  { label: 'Ministerios', icon: Church, path: '/ministerios' },
  { label: 'Agenda', icon: Calendar, path: '/agenda' },
];
const PERFIL_ITEM = { label: 'Perfil', icon: User, path: '/perfil' };
const SLIDES_ITEM = { label: 'Slides', icon: MonitorPlay, path: '/slides' };

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const items = (user.superadmin || user.pode_slides)
    ? [...MAIN_ITEMS, SLIDES_ITEM, PERFIL_ITEM]
    : [...MAIN_ITEMS, PERFIL_ITEM];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a1a33] border-t border-white/5 flex z-40 safe-bottom">
      {items.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-90 active:opacity-70 ${
              active ? 'text-blue-400' : 'text-gray-600'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
