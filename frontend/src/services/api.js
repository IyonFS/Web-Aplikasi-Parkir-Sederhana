import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || "";
const BASE_URL = rawBaseURL ? rawBaseURL.replace(/\/+$/, "") + "/api" : "/api";
console.debug("[API] baseURL=", BASE_URL);
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pw_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function isAuthRequest(config = {}) {
  const url = config.url || "";
  return /\/auth\/(login|register)$/.test(url);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const hasToken = Boolean(localStorage.getItem("pw_token"));
    if (
      err.response?.status === 401 &&
      hasToken &&
      !isAuthRequest(err.config)
    ) {
      localStorage.removeItem("pw_token");
      localStorage.removeItem("pw_user");
      window.location.replace("/login");
    }
    return Promise.reject(err);
  },
);

export default api;

