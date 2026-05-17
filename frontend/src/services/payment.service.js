import api from './api';

export const paymentService = {
  async getConfig() {
    const { data } = await api.get('/payments/config');
    return data;
  },
  // Buat pembayaran baru (returns snapToken)
  async create(slotId, vehiclePlate, hours, vehicleType) {
    const { data } = await api.post('/payments/create', { slotId, vehiclePlate, hours, vehicleType });
    return data;
  },
  // Cek status pembayaran
  async getStatus(reservationId) {
    const { data } = await api.get(`/payments/${reservationId}/status`);
    return data;
  },
  // Ambil invoice data
  async getInvoice(reservationId) {
    const { data } = await api.get(`/payments/${reservationId}/invoice`);
    return data;
  },
  async cancelPending(reservationId) {
    const { data } = await api.post(`/payments/${reservationId}/cancel`);
    return data;
  },
  // Demo mode: konfirmasi tanpa Midtrans
  async demoConfirm(reservationId, method, provider) {
    const { data } = await api.post('/payments/demo-confirm', { reservationId, method, provider });
    return data;
  },
};

