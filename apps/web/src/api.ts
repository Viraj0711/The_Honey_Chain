const base = '/api';

const tokenKey = 'hc_token';
const roleKey = 'hc_role';
const nameKey = 'hc_name';

export interface Credentials {
  phone: string;
  password: string;
}

export interface LoginResult {
  token: string;
  role: 'farmer' | 'admin';
  name: string;
}

export const getToken = (): string | null => localStorage.getItem(tokenKey);
export const getRole = (): 'farmer' | 'admin' | null =>
  localStorage.getItem(roleKey) as 'farmer' | 'admin' | null;
export const getName = (): string | null => localStorage.getItem(nameKey);

export const storeSession = (result: LoginResult): void => {
  localStorage.setItem(tokenKey, result.token);
  localStorage.setItem(roleKey, result.role);
  localStorage.setItem(nameKey, result.name);
};

export const clearSession = (): void => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(roleKey);
  localStorage.removeItem(nameKey);
};

const request = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `request failed: ${res.status}`);
  }
  return (await res.json()) as T;
};

export const api = {
  login: (credentials: Credentials) => request<LoginResult>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
