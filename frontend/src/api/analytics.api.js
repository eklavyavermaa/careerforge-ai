import api from './client';

export const analyticsApi = {
  summary: () => api.get('/analytics/summary'),
  weeklyProgress: () => api.get('/analytics/weekly-progress'),
  recentActivity: (params) => api.get('/analytics/recent-activity', { params }),
};
