import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  // No request should hang forever. 45s covers the AI hint call's worst case
  // (up to 4 Gemini attempts with backoff between them) plus a Render
  // free-tier cold-start wake-up, while still failing clearly instead of
  // spinning indefinitely.
  timeout: 45000,
});

// Attach JWT token to every outgoing request, if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("skillbridge_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout only on a true invalid/expired token (401) — see AuthContext
// for the matching session-restore logic and why this distinction matters.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("skillbridge_token");
      localStorage.removeItem("skillbridge_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;