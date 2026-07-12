import api from './client';

export const roadmapApi = {
  generate: (payload) => api.post('/roadmaps', payload),
  list: (params) => api.get('/roadmaps', { params }),
  getById: (id) => api.get(`/roadmaps/${id}`),
  updateItem: (id, itemId, isCompleted) => api.patch(`/roadmaps/${id}/items/${itemId}`, { isCompleted }),
  remove: (id) => api.delete(`/roadmaps/${id}`),
};
