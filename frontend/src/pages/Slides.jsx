import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { Plus, Trash2, ImageOff, MonitorPlay, Calendar, ToggleLeft, ToggleRight, Upload, CalendarClock, Pencil, X, Check } from 'lucide-react';

const DIAS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

function parseData(v) {
  if (!v) return null;
  const d = new Date(typeof v === 'string' && v.length === 10 ? v + 'T00:00:00' : v);
  return isNaN(d.getTime()) ? null : d;
}

function formatarData(v) {
  const d = parseData(v);
  return d ? d.toLocaleDateString('pt-BR') : null;
}

function statusSlide(slide) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (!slide.ativo) return { label: 'Inativo', color: 'text-gray-500 bg-gray-500/10' };
  const inicio = parseData(slide.data_inicio);
  const fim = parseData(slide.data_fim);
  if (inicio && inicio > hoje) return { label: 'Agendado', color: 'text-yellow-400 bg-yellow-400/10' };
  if (fim && fim < hoje) return { label: 'Expirado', color: 'text-red-400 bg-red-400/10' };
  return { label: 'Ativo', color: 'text-green-400 bg-green-400/10' };
}

async function gerarRecorte(imageSrc, pixelCrop) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageSrc;
  await new Promise((r) => { img.onload = r; });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  canvas.getContext('2d').drawImage(
    img,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );
  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
}

function ModalCrop({ src, onConfirm, onCancelar }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  const confirmar = async () => {
    if (!croppedAreaPixels) return;
    const blob = await gerarRecorte(src, croppedAreaPixels);
    onConfirm(blob);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <p className="text-white font-bold text-sm">Ajustar imagem (1:1 · quadrado)</p>
        <button onClick={onCancelar} className="text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="relative flex-grow">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="px-6 py-4 border-t border-white/10 flex items-center gap-4">
        <input
          type="range" min={1} max={3} step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-grow accent-blue-500"
        />
        <button
          onClick={confirmar}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
        >
          <Check size={14} /> Confirmar
        </button>
      </div>
    </div>
  );
}

function FormImagem({ preview, onFile, onRemover, onRecortar, children }) {
  return (
    <div>
      {preview ? (
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Pre-visualizacao</p>
          <div className="relative rounded-xl overflow-hidden aspect-video">
            <img src={preview} alt="preview" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-3">{children}</div>
            <div className="absolute top-2 right-2 flex gap-1">
              {onRecortar && (
                <button
                  onClick={onRecortar}
                  className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-blue-600/80 transition-all"
                >
                  Recortar
                </button>
              )}
              <button
                onClick={onRemover}
                className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600/80 transition-all"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="w-full border border-dashed border-white/10 rounded-xl py-4 flex flex-col items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          <span className="flex items-center gap-2"><Upload size={14} /> Carregar foto (opcional)</span>
          <span className="text-[10px] text-gray-700">ideal: 1080 × 1080 px</span>
        </label>
      )}
    </div>
  );
}

function Slides() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [aba, setAba] = useState('slides');

  // Crop modal
  const [cropSrc, setCropSrc] = useState('');
  const [cropCallback, setCropCallback] = useState(null);

  // --- Slides ---
  const [slides, setSlides] = useState([]);
  const [carregandoSlides, setCarregandoSlides] = useState(true);
  const [salvandoSlide, setSalvandoSlide] = useState(false);
  const [slideEditando, setSlideEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [slideFile, setSlideFile] = useState(null);
  const [slidePreview, setSlidePreview] = useState('');
  const [slideOriginalSrc, setSlideOriginalSrc] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // --- Eventos Fixos ---
  const [eventos, setEventos] = useState([]);
  const [carregandoEventos, setCarregandoEventos] = useState(true);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [evNome, setEvNome] = useState('');
  const [evDia, setEvDia] = useState('');
  const [evHorario, setEvHorario] = useState('');
  const [evFile, setEvFile] = useState(null);
  const [evPreview, setEvPreview] = useState('');
  const [evOriginalSrc, setEvOriginalSrc] = useState('');

  useEffect(() => {
    if (!user.superadmin && !user.pode_slides) {
      navigate('/home');
      return;
    }
    carregarSlides();
    carregarEventos();
  }, []);

  const abrirCrop = (fileSrc, onConfirm) => {
    setCropSrc(fileSrc);
    setCropCallback(() => onConfirm);
  };

  const handleFile = (setFile, setPreview, setOriginalSrc) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Use uma foto menor que 10MB.');
      return;
    }
    const src = URL.createObjectURL(file);
    if (setOriginalSrc) setOriginalSrc(src);
    abrirCrop(src, (blob) => {
      const croppedFile = new File([blob], file.name, { type: 'image/jpeg' });
      setFile(croppedFile);
      setPreview(URL.createObjectURL(blob));
      setCropSrc('');
    });
  };

  // Slides
  const carregarSlides = async () => {
    setCarregandoSlides(true);
    try {
      const res = await api.get('/slides-login/admin');
      setSlides(res.data);
    } catch {
      toast.error('Erro ao carregar slides.');
    } finally {
      setCarregandoSlides(false);
    }
  };

  const abrirEdicao = (slide) => {
    setSlideEditando(slide);
    setTitulo(slide.titulo || '');
    setSubtitulo(slide.subtitulo || '');
    setDataInicio(slide.data_inicio ? slide.data_inicio.split('T')[0] : '');
    setDataFim(slide.data_fim ? slide.data_fim.split('T')[0] : '');
    setSlideFile(null);
    setSlidePreview(slide.imagem_url || '');
    setSlideOriginalSrc(slide.imagem_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setSlideEditando(null);
    setTitulo(''); setSubtitulo(''); setSlideFile(null); setSlidePreview('');
    setSlideOriginalSrc(''); setDataInicio(''); setDataFim('');
  };

  const salvarSlide = async () => {
    if (!titulo.trim()) return toast.error('Titulo obrigatorio.');
    setSalvandoSlide(true);
    try {
      const form = new FormData();
      form.append('titulo', titulo);
      if (subtitulo) form.append('subtitulo', subtitulo);
      if (slideFile) form.append('imagem', slideFile);
      if (dataInicio) form.append('data_inicio', dataInicio);
      if (dataFim) form.append('data_fim', dataFim);

      if (slideEditando) {
        const res = await api.patch(`/slides-login/${slideEditando.id}`, form);
        setSlides((prev) => prev.map((s) => s.id === slideEditando.id ? res.data : s));
        toast.success('Slide atualizado!');
        cancelarEdicao();
      } else {
        await api.post('/slides-login', form);
        toast.success('Slide criado!');
        setTitulo(''); setSubtitulo(''); setSlideFile(null); setSlidePreview('');
        setDataInicio(''); setDataFim('');
        carregarSlides();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar slide.');
    } finally {
      setSalvandoSlide(false);
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
      if (slideEditando?.id === id) cancelarEdicao();
      toast.success('Slide removido.');
    } catch {
      toast.error('Erro ao remover slide.');
    }
  };

  // Eventos Fixos
  const carregarEventos = async () => {
    setCarregandoEventos(true);
    try {
      const res = await api.get('/eventos-fixos/admin');
      setEventos(res.data);
    } catch {
      toast.error('Erro ao carregar eventos fixos.');
    } finally {
      setCarregandoEventos(false);
    }
  };

  const criarEvento = async () => {
    if (!evNome.trim()) return toast.error('Nome obrigatorio.');
    setSalvandoEvento(true);
    try {
      const form = new FormData();
      form.append('nome', evNome);
      if (evDia !== '') form.append('dia_semana', evDia);
      if (evHorario) form.append('horario', evHorario);
      if (evFile) form.append('imagem', evFile);
      await api.post('/eventos-fixos', form);
      toast.success('Evento criado!');
      setEvNome(''); setEvDia(''); setEvHorario(''); setEvFile(null); setEvPreview('');
      carregarEventos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar evento.');
    } finally {
      setSalvandoEvento(false);
    }
  };

  const toggleEvento = async (id) => {
    try {
      const res = await api.patch(`/eventos-fixos/${id}/toggle`);
      setEventos((prev) => prev.map((e) => e.id === id ? res.data : e));
    } catch {
      toast.error('Erro ao atualizar evento.');
    }
  };

  const deletarEvento = async (id) => {
    try {
      await api.delete(`/eventos-fixos/${id}`);
      setEventos((prev) => prev.filter((e) => e.id !== id));
      toast.success('Evento removido.');
    } catch {
      toast.error('Erro ao remover evento.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050b18]">
      <Sidebar />

      {cropSrc && (
        <ModalCrop
          src={cropSrc}
          onConfirm={cropCallback}
          onCancelar={() => setCropSrc('')}
        />
      )}

      <main className="lg:ml-64 flex-grow p-6 lg:p-10 text-white pb-24 lg:pb-10">

        <div className="mb-6 flex items-center gap-3">
          <MonitorPlay size={22} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">Tela de Login</h1>
            <p className="text-gray-600 text-xs mt-0.5">Gerencie o carrossel exibido na tela de acesso</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
          <button
            onClick={() => setAba('slides')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${aba === 'slides' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Slides
          </button>
          <button
            onClick={() => setAba('eventos')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${aba === 'eventos' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Eventos Fixos
          </button>
        </div>

        <div className="max-w-2xl space-y-6">

          {aba === 'slides' && (
            <>
              {/* Lista de slides */}
              <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
                <h2 className="text-sm font-bold text-white mb-4">Slides cadastrados</h2>
                {carregandoSlides ? (
                  <p className="text-gray-600 text-sm italic">Carregando...</p>
                ) : slides.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">Nenhum slide criado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {slides.map((s) => {
                      const st = statusSlide(s);
                      const editando = slideEditando?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center gap-3 rounded-xl p-3 transition-all ${editando ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-white/5'}`}
                        >
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
                            {(formatarData(s.data_inicio) || formatarData(s.data_fim)) && (
                              <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                                <Calendar size={9} />
                                {formatarData(s.data_inicio) || '...'}{' - '}{formatarData(s.data_fim) || 'sem fim'}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => editando ? cancelarEdicao() : abrirEdicao(s)}
                              className={`transition-colors ${editando ? 'text-blue-400' : 'text-gray-600 hover:text-blue-400'}`}
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deletarSlide(s.id)} className="text-gray-600 hover:text-red-400 transition-colors" title="Remover">
                              <Trash2 size={14} />
                            </button>
                            <button onClick={() => toggleSlide(s.id)} className="text-gray-600 hover:text-blue-400 transition-colors" title={s.ativo ? 'Desativar' : 'Ativar'}>
                              {s.ativo ? <ToggleRight size={18} className="text-blue-400" /> : <ToggleLeft size={18} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formulario criar / editar slide */}
              <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white">
                    {slideEditando ? `Editando: ${slideEditando.titulo}` : 'Novo slide'}
                  </h2>
                  {slideEditando && (
                    <button onClick={cancelarEdicao} className="text-gray-500 hover:text-white transition-colors text-xs">
                      Cancelar edicao
                    </button>
                  )}
                </div>
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
                  <FormImagem
                    preview={slidePreview}
                    onFile={handleFile(setSlideFile, setSlidePreview, setSlideOriginalSrc)}
                    onRemover={() => { setSlideFile(null); setSlidePreview(''); setSlideOriginalSrc(''); }}
                    onRecortar={slideOriginalSrc ? () => abrirCrop(slideOriginalSrc, (blob) => {
                      const f = new File([blob], 'slide.jpg', { type: 'image/jpeg' });
                      setSlideFile(f);
                      setSlidePreview(URL.createObjectURL(blob));
                      setCropSrc('');
                    }) : undefined}
                  >
                    <p className="text-white font-black text-sm leading-tight drop-shadow">{titulo || 'Titulo do slide'}</p>
                    {subtitulo && <p className="text-gray-300 text-xs mt-0.5 drop-shadow">{subtitulo}</p>}
                  </FormImagem>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Exibir a partir de</label>
                      <input type="date" className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm [color-scheme:dark]" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Exibir ate</label>
                      <input type="date" className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm [color-scheme:dark]" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                    </div>
                  </div>
                  <button onClick={salvarSlide} disabled={salvandoSlide} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50">
                    {slideEditando ? (
                      <><Check size={14} className="inline mr-1" />{salvandoSlide ? 'Salvando...' : 'Salvar alteracoes'}</>
                    ) : (
                      <><Plus size={14} className="inline mr-1" />{salvandoSlide ? 'Salvando...' : 'Adicionar slide'}</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {aba === 'eventos' && (
            <>
              {/* Lista de eventos fixos */}
              <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
                <h2 className="text-sm font-bold text-white mb-4">Eventos cadastrados</h2>
                {carregandoEventos ? (
                  <p className="text-gray-600 text-sm italic">Carregando...</p>
                ) : eventos.length === 0 ? (
                  <p className="text-gray-600 text-sm italic">Nenhum evento fixo criado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {eventos.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                          {ev.imagem_url ? (
                            <img src={ev.imagem_url} alt={ev.nome} className="w-full h-full object-cover" />
                          ) : (
                            <CalendarClock size={14} className="text-gray-600" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold text-white truncate">{ev.nome}</p>
                          <p className="text-[10px] text-gray-500">
                            {ev.dia_semana != null ? DIAS[ev.dia_semana] : 'Sem dia'}{ev.horario ? ` — ${ev.horario}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleEvento(ev.id)} className="text-gray-600 hover:text-blue-400 transition-colors" title={ev.ativo ? 'Desativar' : 'Ativar'}>
                            {ev.ativo ? <ToggleRight size={18} className="text-blue-400" /> : <ToggleLeft size={18} />}
                          </button>
                          <button onClick={() => deletarEvento(ev.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulario novo evento */}
              <div className="bg-[#0a1a33] rounded-2xl border border-white/5 p-6">
                <h2 className="text-sm font-bold text-white mb-4">Novo evento fixo</h2>
                <div className="space-y-3">
                  <input
                    className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                    placeholder="Nome (ex: Culto Domingo)"
                    value={evNome}
                    onChange={(e) => setEvNome(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Dia da semana</label>
                      <select
                        className="w-full bg-[#050b18] border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm"
                        value={evDia}
                        onChange={(e) => setEvDia(e.target.value)}
                      >
                        <option value="">Selecionar</option>
                        {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Horario</label>
                      <input
                        className="w-full bg-transparent border-b border-gray-700 py-2 outline-none focus:border-blue-500 transition-colors text-white text-sm placeholder-gray-600"
                        placeholder="ex: 18h30"
                        value={evHorario}
                        onChange={(e) => setEvHorario(e.target.value)}
                      />
                    </div>
                  </div>
                  <FormImagem
                    preview={evPreview}
                    onFile={handleFile(setEvFile, setEvPreview, setEvOriginalSrc)}
                    onRemover={() => { setEvFile(null); setEvPreview(''); setEvOriginalSrc(''); }}
                    onRecortar={evOriginalSrc ? () => abrirCrop(evOriginalSrc, (blob) => {
                      const f = new File([blob], 'evento.jpg', { type: 'image/jpeg' });
                      setEvFile(f);
                      setEvPreview(URL.createObjectURL(blob));
                      setCropSrc('');
                    }) : undefined}
                  >
                    <p className="text-white font-black text-sm leading-tight drop-shadow">{evNome || 'Nome do evento'}</p>
                    {evHorario && <p className="text-gray-300 text-xs mt-0.5 drop-shadow">{evHorario}</p>}
                  </FormImagem>
                  <button onClick={criarEvento} disabled={salvandoEvento} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50">
                    <Plus size={14} className="inline mr-1" />
                    {salvandoEvento ? 'Salvando...' : 'Adicionar evento'}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default Slides;
