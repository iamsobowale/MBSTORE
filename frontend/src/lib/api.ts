import axios from "axios";

/**
 * Shared HTTP client. Base URL comes from the environment so the same build can
 * target different backends. The admin JWT (when present) is attached automatically.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5159/api/v1",
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "mb_admin_token";

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
