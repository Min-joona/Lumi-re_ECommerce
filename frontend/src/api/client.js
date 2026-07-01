import axios from 'axios';

// In dev, Vite proxies /api to the backend. In prod, set VITE_API_URL to the deployed API.
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
