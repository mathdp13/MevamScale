import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // A porta onde seu backend está rodando
});

// Anexa JWT em toda chamad
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;