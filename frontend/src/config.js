/**
 * Frontend config from Vite env.
 * In dev with proxy, VITE_API_BASE is empty so /api goes to backend.
 * For production or custom backend, set VITE_API_BASE (e.g. https://api.example.com).
 */
export const config = {
  apiBase: import.meta.env.VITE_API_BASE ?? '',
};
