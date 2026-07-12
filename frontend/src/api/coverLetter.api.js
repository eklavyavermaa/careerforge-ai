import api from './client';

export const coverLetterApi = {
  generate: (payload) => api.post('/cover-letters', payload),
  list: (params) => api.get('/cover-letters', { params }),
  getById: (id) => api.get(`/cover-letters/${id}`),
  remove: (id) => api.delete(`/cover-letters/${id}`),
};
