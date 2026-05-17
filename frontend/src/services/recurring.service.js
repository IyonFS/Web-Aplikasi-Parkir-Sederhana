import api from './api';

export const recurringService = {
  async list() {
    const { data } = await api.get('/recurring');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/recurring', payload);
    return data;
  },
  async toggle(id) {
    const { data } = await api.patch(`/recurring/${id}/toggle`);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/recurring/${id}`);
    return data;
  },
  async runNow() {
    const { data } = await api.post('/recurring/run-now');
    return data;
  },
};

