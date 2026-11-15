export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The service returned an unreadable response. Please retry.');
  }
  if (response.status === 401) window.dispatchEvent(new CustomEvent('auth-expired'));
  if (!response.ok || data.success === false)
    throw new Error(data.message || data.error || 'The request could not be completed');
  return data;
}
