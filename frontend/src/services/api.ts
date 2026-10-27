import axios from 'axios';
import { API_BASE } from '../utils/env';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/signin';
    }
    return Promise.reject(err);
  }
);

export default api;
