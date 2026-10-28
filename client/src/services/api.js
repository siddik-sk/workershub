import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;
    const normalized = new Error(apiError?.message || error.message || 'Something went wrong');
    normalized.status = status;
    normalized.code = apiError?.code;
    normalized.details = apiError?.details;

    if (
      status === 401 &&
      !String(error.config?.url || '').includes('/auth/login') &&
      !String(error.config?.url || '').includes('/auth/me')
    ) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(normalized);
  }
);

export default api;
