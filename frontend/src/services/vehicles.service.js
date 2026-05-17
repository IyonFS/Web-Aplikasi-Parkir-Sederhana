import api from './api';

export const vehiclesService = {
  async list() {
    const { data } = await api.get('/vehicles');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/vehicles', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/vehicles/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/vehicles/${id}`);
    return data;
  },
};

