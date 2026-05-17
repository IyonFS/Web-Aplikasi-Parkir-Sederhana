import api from './api';

export const tariffsService = {
  async list() {
    const { data } = await api.get('/tariffs');
    return data;
  },
  async getActivePrice(vehicleType) {
    const { data } = await api.get('/tariffs');
    const activeTariff = (data.tariffs || []).find(
      (item) => item.isActive && item.vehicleType === vehicleType,
    );
    return activeTariff || null;
  },
  async create(payload) {
    const { data } = await api.post('/tariffs', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/tariffs/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/tariffs/${id}`);
    return data;
  },
};

