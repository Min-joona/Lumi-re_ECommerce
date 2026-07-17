import axios from 'axios';

// In dev, Vite proxies /api to the backend. In prod, set VITE_API_URL to the deployed API.
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL, withCredentials: true });

let isRefreshing = false;
let refreshQueue = [];
const resolveRefreshQueue = (error, token) => {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  refreshQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status !== 401 || request?._retried || request?.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }
    request._retried = true;
    if (isRefreshing) {
      const token = await new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }));
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    }
    isRefreshing = true;
    try {
      const { data } = await api.post('/api/auth/refresh');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      resolveRefreshQueue(null, data.token);
      request.headers.Authorization = `Bearer ${data.token}`;
      return api(request);
    } catch (refreshError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      resolveRefreshQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
