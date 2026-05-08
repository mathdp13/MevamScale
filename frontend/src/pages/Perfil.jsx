import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, Plus, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

function Perfil() {
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [dados, setDados] = useState({
    nome: user.nome || '',
    telefone: '',
    data_nascimento: '',
    foto_url: user.foto_url || '',
  });

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await api.get(`/usuarios/${user.id}`);
        const d = res.data;
        setDados({
          nome: d.nome || '',
          telefone: d.telefone || '',
          foto_url: d.foto_url || '',
          data_nascimento: d.data_nascimento ? d.data_nascimento.split('T')[0] : '',
        });
      } catch (err) {
        console.error('Erro ao carregar perfil', err);
      }
    };
    if (user.id) buscar();
  }, [user.id]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setDados((prev) => ({ ...prev, foto_url: canvas.toDataURL('image/jpeg', 0.6) }));
      };
    };
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    setLoading(true);
    const toastId = toast.loading('Salvando...');
    try {
      await api.put(`/usuarios/${user.id}`, {
        nome: dados.nome,
        foto_url: dados.foto_url || '',
        telefone: dados.telefone || '',
        data_nascimento: dados.data_nascimento || null,
      });

      const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
      try {
        localStorage.setItem('user', JSON.stringify({ ...userLocal, nome: dados.nome, foto_url: dados.foto_url }));
      } catch {
        localStorage.setItem('user', JSON.stringify({ ...userLocal, nome: dados.nome }));
      }

      toast.success('Perfil atualizado!', { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Erro ao salvar.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">
        <Toaster />
        <h1 className="text-3xl font-bold tracking-tighter text-blue-400 mb-10">Meu Perfil</h1>

        <div className="max-w-md space-y-8">
          {/* Foto */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden bg-[#0a1a33] flex items-center justify-center">
              {dados.foto_url ? (
                <img src={dados.foto_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <Camera size={40} className="text-gray-600" />
              )}
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-all"
              >
                <Plus size={16} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFotoChange} accept="image/*" className="hidden" />
            </div>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>

          {/* Campos */}
          <div className="bg-[#0a1a33] p-6 rounded-2xl border border-white/5 space-y-5">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Nome</label>
              <input
                type="text"
                value={dados.nome}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Telefone</label>
              <input
                type="text"
                value={dados.telefone}
                onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Data de Nascimento</label>
              <input
                type="date"
                value={dados.data_nascimento}
                onChange={(e) => setDados({ ...dados, data_nascimento: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default Perfil;
