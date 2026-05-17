import api from './api';

export const auditService = {
  async list(params = {}) {
    const { data } = await api.get('/audit-logs', { params });
    return data;
  },
};

