import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, ImageOff, MonitorPlay, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

function statusSlide(slide) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (!slide.ativo) return { label: 'Inativo', color: 'text-gray-500 bg-gray-500/10' };
  const inicio = slide.data_inicio ? new Date(slide.data_inicio + 'T00:00:00') : null;
  const fim = slide.data_fim ? new Date(slide.data_fim + 'T00:00:00') : null;
  if (inicio && inicio > hoje) return { label: 'Agendado', color: 'text-yellow-400 bg-yellow-400/10' };
  if (fim && fim < hoje) return { label: 'Expirado', color: 'text-red-400 bg-red-400/10' };
  return { label: 'Ativo', color: 'text-green-400 bg-green-400/10' };
}

function Slides() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const fileRef = useRef(null);

  const [slides, setSlides] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [imagemFile, setImagemFile] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);

  useEffect(() => {
    if (!user.superadmin && !user.pode_slides) {
      navigate('/home');
      return;
    }
    carregarSlides();
  }, []);

  const carregarSlides = async () => {
    setCarregando(true);
    try {
      const res = await api.get('/slides-login/admin');
      setSlides(res.data);
    } catch {
      toast.error('Erro ao carregar slides.');
    } finally {
      setCarregando(false);
    }
  };

  const handleImagem = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagemFile(file);
    setImagemPreview(URL.createObjectURL(file));
  };

  const criarSlide = async () => {
    if (!titulo.trim()) return toast.error('Titulo obrigatorio.');
    setSalvando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('subtitulo', subtitulo);
      if (dataInicio) formData.append('data_inicio', dataInicio);
      if (dataFim) formData.append('data_fim', dataFim);
      if (imagemFile) formData.append('imagem', imagemFile);
      await api.post('/slides-login', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Slide criado!');
      setTitulo('');
      setSubtitulo('');
      setDataInicio('');
      setDataFim('');
      setImagemFile(null);
      setImagemPreview(null);
      carregarSlides();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'Erro ao criar slide.';
      toast.error(detail);
    } finally {
      setSalvando(false);
    }
  };

  const toggleSlide = async (id) => {
    try {
      const res = await api.patch(`/slides-login/${id}/toggle`);
      setSlides((prev) => prev.map((s) => s.id === id ? res.data : s));
    } catch {
      toast.error('Erro ao atualizar slide.');
    }
  };

  const deletarSlide = async (id) => {
    try {
      await api.delete(`/slides-login/${id}`);
      setSlides((prev) => prev.filter((s) => s.id !== id));
      toast.success('Slide removido.');
    } catch {
      toast.error('Erro ao remover slide.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />
      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">

        <div className="mb-8 flex items-center gap-3">
          <MonitorPlay size={22} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">Slides do Login</h1>
            <p className="text-gray-600 text-xs mt-0.5">Gerencie o carrossel exibido na tela de acesso</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">

          {/* Lista de slides */}
          <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
            <h2 className="text-sm font-bold text-white mb-4">Slides cadastrados</h2>
            {carregando ? (
              <p className="text-gray-600 text-sm italic">Carregando...</p>
            ) : slides.length === 0 ? (
              <p className="text-gray-600 text-sm italic">Nenhum slide criado ainda.</p>
            ) : (
              <div className="space-y-3">
                {slides.map((s) => {
                  const st = statusSlide(s);
                  return (
                    <div key={s.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                        {s.imagem_url ? (
                          <img src={s.imagem_url} alt={s.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff size={14} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate">{s.titulo}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </div>
                        {s.subtitulo && <p className="text-[10px] text-gray-500 truncate">{s.subtitulo}</p>}
                        {(s.data_inicio || s.data_fim) && (
                          <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                            <Calendar size={9} />
                            {s.data_inicio ? new Date(s.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '...'}
                            {' - '}
                            {s.data_fim ? new Date(s.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : 'sem fim'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleSlide(s.id)}
                          className="text-gray-600 hover:text-blue-400 transition-colors"
                          title={s.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {s.ativo ? <ToggleRight size={18} className="text-blue-400" /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => deletarSlide(s.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulario novo slide */}
          <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
            <h2 className="text-sm font-bold text-white mb-4">Novo slide</h2>
            <div className="space-y-3">
              <input
                className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                placeholder="Titulo do slide"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <input
                className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                placeholder="Subtitulo (opcional)"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Exibir a partir de</label>
                  <input
                    type="date"
                    className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm [color-scheme:dark]"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Exibir ate</label>
                  <input
                    type="date"
                    className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm [color-scheme:dark]"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagem} />
                <button
                  onClick={() => fileRef.current.click()}
                  className="w-full border border-dashed border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all"
                >
                  {imagemPreview ? (
                    <img src={imagemPreview} alt="preview" className="h-8 rounded object-cover" />
                  ) : (
                    <>
                      <Upload size={14} /> Selecionar imagem (opcional)
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={criarSlide}
                disabled={salvando}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus size={14} className="inline mr-1" />
                {salvando ? 'Salvando...' : 'Adicionar slide'}
              </button>
            </div>
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default Slides;
