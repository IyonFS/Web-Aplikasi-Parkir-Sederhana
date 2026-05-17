import api from "./api";

export const reservationsService = {
  async list() {
    const { data } = await api.get("/reservations");
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/reservations/${id}`);
    return data;
  },
  async create(slotId, vehiclePlate, hours, vehicleType) {
    const { data } = await api.post("/reservations", {
      slotId,
      vehiclePlate,
      hours,
      vehicleType,
    });
    return data;
  },
  async cancel(id) {
    const { data } = await api.patch(`/reservations/${id}/cancel`);
    return data;
  },
  // BARU: perpanjang reservasi aktif
  async extend(id, extraHours) {
    const { data } = await api.patch(`/reservations/${id}/extend`, {
      extraHours,
    });
    return data;
  },
  // BARU: ambil QR token untuk tiket
  async getQRToken(id) {
    const { data } = await api.get(`/reservations/${id}/qr-token`);
    return data;
  },
  // BARU: hapus riwayat transaksi yang sudah selesai
  async deleteCompletedReservations() {
    const { data } = await api.delete("/reservations/completed");
    return data;
  },
  async deleteFinished(id) {
    const { data } = await api.delete(`/reservations/${id}`);
    return data;
  },
};

