import api from './client';

export const applicationApi = {
  create: (payload) => api.post('/applications', payload),
  list: (params) => api.get('/applications', { params }),
  stats: () => api.get('/applications/stats'),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, payload) => api.patch(`/applications/${id}`, payload),
  updateStatus: (id, status, note) => api.patch(`/applications/${id}/status`, { status, note }),
  remove: (id) => api.delete(`/applications/${id}`),
};
