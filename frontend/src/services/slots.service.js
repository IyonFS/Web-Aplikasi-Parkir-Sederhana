import api from "./api";

export const slotsService = {
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.lotId) params.set("lotId", filters.lotId);
    if (filters.floor) params.set("floor", filters.floor);
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    const { data } = await api.get(`/slots?${params}`);
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/slots/${id}`);
    return data;
  },
  async create(slotData) {
    const { data } = await api.post("/slots", slotData);
    return data;
  },
  async update(id, slotData) {
    const { data } = await api.patch(`/slots/${id}`, slotData);
    return data;
  },
  async delete(id) {
    const { data } = await api.delete(`/slots/${id}`);
    return data;
  },
  async updateStatus(id, status) {
    const { data } = await api.patch(`/slots/${id}/status`, { status });
    return data;
  },
};

