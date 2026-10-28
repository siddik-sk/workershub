import api from './api';

export const authApi = {
  registerCustomer: (payload) => api.post('/auth/register', payload),
  registerWorker: (formData) =>
    api.post('/auth/register/worker', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  loginCustomer: (payload) => api.post('/auth/login', payload),
  loginWorker: (payload) => api.post('/auth/login/worker', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.patch('/auth/password', payload),
};

export const categoryApi = {
  list: () => api.get('/categories'),
};

export const publicApi = {
  stats: () => api.get('/public/stats'),
};

export const workerApi = {
  search: (params) => api.get('/workers', { params }),
  featured: (limit = 6) => api.get('/workers/featured', { params: { limit } }),
  get: (id) => api.get(`/workers/${id}`),
  dashboard: () => api.get('/worker/dashboard'),
  profile: () => api.get('/worker/profile'),
  updateProfile: (formData) =>
    api.patch('/worker/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateAvailability: (payload) => api.patch('/worker/availability', payload),
  bookings: (params) => api.get('/worker/bookings', { params }),
  acceptBooking: (id) => api.patch(`/worker/bookings/${id}/accept`),
  rejectBooking: (id, reason) => api.patch(`/worker/bookings/${id}/reject`, { reason }),
  startBooking: (id) => api.patch(`/worker/bookings/${id}/start`),
  completeBooking: (id) => api.patch(`/worker/bookings/${id}/complete`),
  cancelBooking: (id, reason) => api.patch(`/worker/bookings/${id}/cancel`, { reason }),
};

export const bookingApi = {
  create: (payload) => api.post('/bookings', payload),
  my: (params) => api.get('/bookings/my', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  review: (id, payload) => api.post(`/bookings/${id}/review`, payload),
};

export const userApi = {
  dashboard: () => api.get('/user/dashboard'),
  updateProfile: (payload) => api.patch('/user/profile', payload),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const adminApi = {
  dashboard: (params) => api.get('/admin/dashboard', { params }),
  users: (params) => api.get('/admin/users', { params }),
  user: (id) => api.get(`/admin/users/${id}`),
  setUserStatus: (id, payload) => api.patch(`/admin/users/${id}/status`, payload),
  workers: (params) => api.get('/admin/workers', { params }),
  worker: (id) => api.get(`/admin/workers/${id}`),
  setWorkerApproval: (id, payload) => api.patch(`/admin/workers/${id}/approval`, payload),
  setWorkerStatus: (id, payload) => api.patch(`/admin/workers/${id}/status`, payload),
  categories: () => api.get('/admin/categories'),
  createCategory: (payload) => api.post('/admin/categories', payload),
  updateCategory: (id, payload) => api.patch(`/admin/categories/${id}`, payload),
  bookings: (params) => api.get('/admin/bookings', { params }),
  bookingStats: () => api.get('/admin/bookings/stats'),
  booking: (id) => api.get(`/admin/bookings/${id}`),
  cancelBooking: (id, reason) => api.patch(`/admin/bookings/${id}/cancel`, { reason }),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
};
