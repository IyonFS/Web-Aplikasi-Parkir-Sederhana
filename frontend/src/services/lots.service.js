import api from './api';

export const lotsService = {
  async list() {
    const { data } = await api.get('/lots');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/lots', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/lots/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/lots/${id}`);
    return data;
  },
};

