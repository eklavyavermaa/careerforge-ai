import api from './client';

export const analysisApi = {
  analyze: (payload) => api.post('/analysis', payload),
  list: (params) => api.get('/analysis', { params }),
  listForResume: (resumeId, params) => api.get(`/analysis/resume/${resumeId}`, { params }),
  getById: (id) => api.get(`/analysis/${id}`),
};
