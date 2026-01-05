const STORAGE_KEY = "parhly.session";

export function getAuth() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(value) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearAuth() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getToken() {
  return getAuth()?.token || "";
}
