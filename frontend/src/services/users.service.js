import api from "./api";

export const usersService = {
  // Profile
  async getProfile() {
    const { data } = await api.get("/users/me/profile");
    return data;
  },
  async updateProfile(payload) {
    const { data } = await api.patch("/users/me/profile", payload);
    return data;
  },
  async changePassword(payload) {
    const { data } = await api.patch("/users/me/password", payload);
    return data;
  },
  // Admin: user management
  async list(params = {}) {
    const { data } = await api.get("/users", { params });
    return data;
  },
  async getUser(id) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/users", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  },
  async toggleActive(id) {
    const { data } = await api.patch(`/users/${id}/toggle-active`);
    return data;
  },
  async updateRole(id, role) {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data;
  },
  async deleteUser(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

