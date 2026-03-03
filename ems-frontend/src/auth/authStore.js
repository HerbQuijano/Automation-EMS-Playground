const KEY = "ems_auth";

export function setAuth({ token, user, expires_at }) {
  localStorage.setItem(KEY, JSON.stringify({ token, user, expires_at }));
}

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function getToken() {
  return getAuth()?.token || null;
}

export function getUser() {
  return getAuth()?.user || null;
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function isExpired() {
  const exp = getAuth()?.expires_at;
  if (!exp) return false;
  return new Date() > new Date(exp);
}
