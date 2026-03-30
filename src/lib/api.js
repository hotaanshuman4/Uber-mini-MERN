import axios from 'axios';

/** API origin without /api — empty in dev uses Vite proxy to backend :5000 */
const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? (import.meta.env.DEV ? '' : 'http://localhost:5000');

export const apiClient = axios.create({
  baseURL: `${apiOrigin}/api`,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Human-readable message for failed auth/API calls */
export function getApiErrorMessage(err) {
  const d = err.response?.data;
  if (typeof d === 'string' && d.trim()) return d;
  if (d && typeof d === 'object' && d.message) return d.message;
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Cannot reach the server. Start the backend (npm run dev in /backend, port 5000) and ensure MongoDB is running.';
  }
  if (err.response?.status === 503) {
    return (
      (typeof d === 'object' && d?.message) ||
      'Service unavailable — database may be offline. Start MongoDB and restart the API server.'
    );
  }
  return err.message || 'Request failed.';
}
