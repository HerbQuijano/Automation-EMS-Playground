import { getToken, clearAuth } from "../auth/authStore";

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });

  // Si el token ya no sirve, limpiamos y mandamos a login
  if (res.status === 401) {
    clearAuth();
    // Evita loop si ya estamos en login
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
