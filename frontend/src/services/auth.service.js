import api from './api';

export const authService = {
  async register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('pw_token', data.token);
    localStorage.setItem('pw_user', JSON.stringify(data.user));
    return data;
  },
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pw_token', data.token);
    localStorage.setItem('pw_user', JSON.stringify(data.user));
    return data;
  },
  async me() {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('pw_user', JSON.stringify(data.user));
    return data.user;
  },
  logout() {
    localStorage.removeItem('pw_token');
    localStorage.removeItem('pw_user');
  },
  setUser(user) {
    localStorage.setItem('pw_user', JSON.stringify(user));
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem('pw_user')); } catch { return null; }
  },
  getToken() { return localStorage.getItem('pw_token'); },
};

