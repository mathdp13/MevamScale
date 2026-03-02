import axios from 'axios';

const api = axios.create({
  // Alterado de localhost para o IP físico da minha maquina
  baseURL: import.meta.env.VITE_API_URL,
});

// Anexa JWT em toda chamada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;