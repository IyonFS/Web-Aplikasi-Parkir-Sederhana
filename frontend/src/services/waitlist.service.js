import api from './api';

export const waitlistService = {
  async list(slotId = '') {
    const { data } = await api.get('/waitlist', { params: slotId ? { slotId } : {} });
    return data;
  },
  async join(slotId, vehiclePlate, hours = 2) {
    const { data } = await api.post('/waitlist', { slotId, vehiclePlate, hours });
    return data;
  },
  async cancel(id) {
    const { data } = await api.patch(`/waitlist/${id}/cancel`);
    return data;
  },
  async confirm(id) {
    const { data } = await api.patch(`/waitlist/${id}/confirm`);
    return data;
  },
};

