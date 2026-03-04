import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function Ministerios() {
  const [meusMinisterios, setMeusMinisterios] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Busca os ministérios que esse usuário participa
  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get(`/usuarios/${user.id}/ministerios`);
        setMeusMinisterios(res.data);
      } catch (err) {
        console.error("Erro ao carregar ministérios", err);
      }
    };
    carregar();
  }, [user.id]);

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar /> 

      <main className="ml-64 flex-grow p-10 text-white">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tighter text-blue-400">Meus Ministérios</h1>
          <p className="text-gray-500 text-sm">Selecione um ministério para ver as escalas e membros.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meusMinisterios.map((min) => (
            <div 
              key={min.id}
              className="bg-[#0a1a33] p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
            >
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400">{min.nome}</h3>
              <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                Código: {min.codigo_acesso}
              </p>
            </div>
          ))}

          {meusMinisterios.length === 0 && (
            <p className="text-gray-600 italic">Você ainda não participa de nenhum ministério.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Ministerios;