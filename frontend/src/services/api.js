import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost';


const api = axios.create({

  baseURL: isLocalhost ? 'http://localhost:3001' : '/api',
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