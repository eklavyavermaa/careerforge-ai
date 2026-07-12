import api from './client';

export const interviewApi = {
  start: (payload) => api.post('/interviews', payload),
  list: (params) => api.get('/interviews', { params }),
  getById: (id) => api.get(`/interviews/${id}`),
  submitAnswer: (id, questionId, answer) => api.post(`/interviews/${id}/questions/${questionId}/answer`, { answer }),
  complete: (id) => api.post(`/interviews/${id}/complete`),
  remove: (id) => api.delete(`/interviews/${id}`),
};
