import axios from 'axios';
import useAuthStore from '../store/authStore.js';

/** Dev: full origin from .env.development. Prod: same-origin `/api`. */
export function getApiBaseURL() {
  const origin = import.meta.env.VITE_API_ORIGIN;
  if (origin) return `${String(origin).replace(/\/$/, '')}/api`;
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const { refreshToken, updateToken, logout } = useAuthStore.getState();
      try {
        const res = await axios.post(`${getApiBaseURL()}/auth/refresh`, { refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });
        const { accessToken, refreshToken: newRefresh } = res.data.data;
        updateToken(accessToken, newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        logout();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
