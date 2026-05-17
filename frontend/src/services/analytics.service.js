import api from "./api";

export const analyticsService = {
  async getSummary() {
    const { data } = await api.get("/analytics/summary");
    return data;
  },
  async getRevenue(options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append("startDate", options.startDate);
    if (options.endDate) params.append("endDate", options.endDate);
    if (!options.startDate && !options.endDate)
      params.append("days", options.days || 7);
    const { data } = await api.get(`/analytics/revenue?${params.toString()}`);
    return data;
  },
  async getPeakHours(options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append("startDate", options.startDate);
    if (options.endDate) params.append("endDate", options.endDate);
    const { data } = await api.get(
      `/analytics/peak-hours?${params.toString()}`,
    );
    return data;
  },
};

