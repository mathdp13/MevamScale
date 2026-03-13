import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, Plus, X, Save } from 'lucide-react';
import bgHeader from '../assets/mevammusic.png';

function Perfil() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const fileInputRef = useRef(null);

  const [dados, setDados] = useState({
    nome: user.nome || '',
    telefone: '',
    data_nascimento: '',
    foto_url: '',
    funcoes: []
  });

  const funcoesDisponiveis = ['Guitarra', 'Baixo', 'Teclado', 'Bateria', 'Violão', 'Vocal', 'Técnico de Som'];

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Qualidade 0.6 para garantir que o arquivo fique minúsculo
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setDados(prev => ({ ...prev, foto_url: dataUrl }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await api.get(`/usuarios/${user.id}`);
        const d = res.data;
        setDados(prev => ({ 
          ...prev, 
          ...d,
          nome: d.nome || '',
          telefone: d.telefone || '',
          foto_url: d.foto_url || '',
          data_nascimento: d.data_nascimento ? d.data_nascimento.split('T')[0] : '' 
        }));
      } catch (err) {
        console.error("Erro ao carregar perfil", err);
      }
    };
    if (user.id) buscarDados();
  }, [user.id]);

  const toggleFuncao = (item) => {
    setDados(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(item) 
        ? prev.funcoes.filter(f => f !== item) 
        : [...prev.funcoes, item]
    }));
  };

  const salvarPerfil = async () => {
    setLoading(true);
    const toastId = toast.loading('Salvando alterações...');
    
    try {
      const payload = {
        nome: dados.nome,
        foto_url: dados.foto_url || '',
        telefone: dados.telefone || '',
        data_nascimento: dados.data_nascimento === "" ? null : dados.data_nascimento
      };

      // 1. Salva no Banco (Sempre prioridade)
      await api.put(`/usuarios/${user.id}`, payload);
      
      // 2. Salva as Skills
      await api.post('/usuarios/skills', { 
        funcoes: dados.funcoes,
        usuario_id: user.id
      });

      // 3. Atualiza LocalStorage com segurança contra erro de QUOTA

      const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
      const usuarioBase = { ...userLocal, nome: dados.nome };
      try {
        localStorage.setItem('user', JSON.stringify({ ...usuarioBase, foto_url: dados.foto_url }));
      } catch (e) {
        console.warn("Storage cheio, salvando foto apenas no servidor.");
        localStorage.setItem('user', JSON.stringify(usuarioBase)); // agora executa de verdade
      }

      toast.success("Perfil atualizado!", { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
      

    } catch (error) {
      console.error("ERRO COMPLETO:", error);
      toast.error("Erro ao salvar no servidor.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white pb-10">
      <Toaster />
      
      <div 
        className="h-60 bg-cover bg-center rounded-b-[40px] relative shadow-lg"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(5, 11, 24, 0.6), rgba(5, 11, 24, 0.9)), url(${bgHeader})` }}
      >
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
          <div className="relative w-36 h-36 rounded-full border-8 border-[#050b18] overflow-hidden bg-gray-800 flex items-center justify-center shadow-xl">
            {dados.foto_url ? (
              <img src={dados.foto_url} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <Camera size={50} className="text-gray-600" /> 
            )}

            <button 
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-1 right-1 p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-all z-10 shadow-md active:scale-90"
            >
              <Plus size={18} className="text-white" />
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFotoChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>
      </div>

      <div className="mt-24 px-6 max-w-md mx-auto space-y-6">
        <div className="text-center group">
          <div className="relative inline-block w-full">
            <input 
              type="text"
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
              className="text-3xl font-extrabold text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 w-full text-white pr-8"
              placeholder="Seu Nome"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-3xl space-y-4 border border-white/5 shadow-xl">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Telefone</label>
            <input 
              type="text" 
              value={dados.telefone}
              onChange={e => setDados({...dados, telefone: e.target.value})}
              className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Nascimento</label>
            <input 
              type="date" 
              value={dados.data_nascimento}
              onChange={e => setDados({...dados, data_nascimento: e.target.value})}
              className="w-full bg-transparent border-b border-gray-700 py-2 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Minhas Funções</label>
              <button 
                onClick={() => setModalAberto(true)}
                className="text-blue-500 text-xs font-bold hover:underline"
              >
                Editar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dados.funcoes.map(f => (
                <span key={f} className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                  {f}
                </span>
              ))}
              {dados.funcoes.length === 0 && <p className="text-gray-600 text-xs italic">Nenhuma função selecionada</p>}
            </div>
          </div>
        </div>

        <button 
          onClick={salvarPerfil}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
        >
          {loading ? "Salvando..." : <><Save size={20} /> Salvar Alterações</>}
        </button>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-t-[40px] sm:rounded-[40px] p-8 border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Selecionar Funções</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400"><X /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {funcoesDisponiveis.map(item => (
                <button
                  key={item}
                  onClick={() => toggleFuncao(item)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all ${
                    dados.funcoes.includes(item)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setModalAberto(false)}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-xs"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Perfil;