import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, Plus, Save, Pencil, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

function Perfil() {
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const fileInputRef = useRef(null);

  const [dados, setDados] = useState({
    nome: user.nome || '',
    telefone: '',
    data_nascimento: '',
    foto_url: user.foto_url || '',
  });
  const [rascunho, setRascunho] = useState(dados);

  useEffect(() => {
    if (!user.id) return;
    api.get(`/usuarios/${user.id}`)
      .then((res) => {
        const d = res.data;
        const atualizado = {
          nome: d.nome || '',
          telefone: d.telefone || '',
          foto_url: d.foto_url || '',
          data_nascimento: d.data_nascimento ? d.data_nascimento.split('T')[0] : '',
        };
        setDados(atualizado);
        setRascunho(atualizado);
      })
      .catch(() => {});
  }, [user.id]);

  const iniciarEdicao = () => {
    setRascunho(dados);
    setEditando(true);
  };

  const cancelarEdicao = () => {
    setRascunho(dados);
    setEditando(false);
  };

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
        setRascunho((prev) => ({ ...prev, foto_url: canvas.toDataURL('image/jpeg', 0.6) }));
      };
    };
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    setLoading(true);
    const toastId = toast.loading('Salvando...');
    try {
      await api.put(`/usuarios/${user.id}`, {
        nome: rascunho.nome,
        foto_url: rascunho.foto_url || '',
        telefone: rascunho.telefone || '',
        data_nascimento: rascunho.data_nascimento || null,
      });

      setDados(rascunho);
      setEditando(false);

      const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
      try {
        localStorage.setItem('user', JSON.stringify({ ...userLocal, nome: rascunho.nome, foto_url: rascunho.foto_url }));
      } catch {
        localStorage.setItem('user', JSON.stringify({ ...userLocal, nome: rascunho.nome }));
      }

      toast.success('Perfil atualizado!', { id: toastId });
    } catch {
      toast.error('Erro ao salvar.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">
        <Toaster />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tighter text-blue-400">Meu Perfil</h1>
          {!editando ? (
            <button
              onClick={iniciarEdicao}
              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              <Pencil size={15} /> Editar
            </button>
          ) : (
            <button
              onClick={cancelarEdicao}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors"
            >
              <X size={15} /> Cancelar
            </button>
          )}
        </div>

        <div className="max-w-md space-y-6">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 rounded-full border-4 border-white/10 overflow-hidden bg-[#0a1a33] flex items-center justify-center">
              {(editando ? rascunho.foto_url : dados.foto_url) ? (
                <img src={editando ? rascunho.foto_url : dados.foto_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <Camera size={36} className="text-gray-600" />
              )}
              {editando && (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-all active:scale-90"
                >
                  <Plus size={14} />
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFotoChange} accept="image/*" className="hidden" />
            </div>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>

          {/* Campos */}
          <div className="bg-[#0a1a33] rounded-2xl border border-white/5 overflow-hidden">
            {editando ? (
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Nome</label>
                  <input
                    type="text"
                    value={rascunho.nome}
                    onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Telefone</label>
                  <input
                    type="text"
                    value={rascunho.telefone}
                    onChange={(e) => setRascunho({ ...rascunho, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Data de Nascimento</label>
                  <input
                    type="date"
                    value={rascunho.data_nascimento}
                    onChange={(e) => setRascunho({ ...rascunho, data_nascimento: e.target.value })}
                    className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors text-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                {[
                  { label: 'Nome', valor: dados.nome || '—' },
                  { label: 'Telefone', valor: dados.telefone || '—' },
                  { label: 'Nascimento', valor: formatarData(dados.data_nascimento) },
                ].map(({ label, valor }, i, arr) => (
                  <div key={label} className={`px-6 py-4 flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</span>
                    <span className="text-sm font-bold text-white">{valor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editando && (
            <button
              onClick={salvar}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default Perfil;
