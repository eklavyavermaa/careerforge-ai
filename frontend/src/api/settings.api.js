import api from './client';

export const profileApi = {
  getMine: () => api.get('/profile'),
  updateMine: (payload) => api.patch('/profile', payload),
};

export const settingsApi = {
  getMine: () => api.get('/settings'),
  updateMine: (payload) => api.patch('/settings', payload),
};
