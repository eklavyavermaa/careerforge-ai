import api from './client';

export const resumeApi = {
  upload: (formData, onUploadProgress) =>
    api.post('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  list: (params) => api.get('/resumes', { params }),
  getById: (id, includeText = false) => api.get(`/resumes/${id}`, { params: { includeText } }),
  getVersions: (id) => api.get(`/resumes/${id}/versions`),
  updateTitle: (id, title) => api.patch(`/resumes/${id}`, { title }),
  remove: (id) => api.delete(`/resumes/${id}`),
};
