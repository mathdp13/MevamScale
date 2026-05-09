import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
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

        <div className="max-w-sm">
          <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-8 text-center">
            <p className="text-gray-500 text-sm font-bold">Em breve</p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
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
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default Home;
