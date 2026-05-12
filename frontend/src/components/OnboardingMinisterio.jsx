import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function OnboardingMinisterio({ ministerioId, onConcluir }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [funcoes, setFuncoes] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/ministerios/${ministerioId}/funcoes`)
      .then((res) => setFuncoes(res.data))
      .catch(() => toast.error('Erro ao carregar funcoes.'));
  }, [ministerioId]);

  const toggle = (id) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const confirmar = async () => {
    setLoading(true);
    try {
      await api.post(`/ministerios/${ministerioId}/membro-funcoes`, {
        usuario_id: user.id,
        funcao_ids: selecionadas,
      });
      toast.success('Bem-vindo ao ministerio!');
      onConcluir();
    } catch {
      toast.error('Erro ao salvar funcoes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a1a33] w-full max-w-sm rounded-3xl p-8 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-1">Você entrou!</h2>
        <p className="text-gray-500 text-sm mb-6">Selecione suas funcoes neste ministerio.</p>

        {funcoes.length === 0 ? (
          <p className="text-gray-600 text-sm italic mb-6">
            Nenhuma funcao cadastrada ainda. O admin vai configurar em breve.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {funcoes.map((f) => (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={`p-3 rounded-2xl text-sm font-bold transition-all ${
                  selecionadas.includes(f.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.nome}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
        >
          {loading ? 'Salvando...' : 'Confirmar'}
        </button>

        {funcoes.length === 0 && (
          <button
            onClick={onConcluir}
            className="w-full mt-3 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            Pular por agora
          </button>
        )}
      </div>
    </div>
  );
}

export default OnboardingMinisterio;
