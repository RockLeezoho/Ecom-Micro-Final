import type { User } from '../types';

const USER_API_BASE = '/api/users';
const MANAGEMENT_API_BASE = '/api/management';
const SESSION_STORAGE_KEY = 'becshop.session';

type LoginRole = 'customer' | 'staff' | 'admin';

type BackendUser = {
  id: string;
  username?: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
  role?: User['role'];
  is_active?: boolean;
  employment_type?: string | null;
  height?: number | null;
  weight?: number | null;
  foot_length?: number | null;
};

export interface AuthSession {
  user: User;
  access: string;
  refresh: string;
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function getAutoLogoutDelayMs(token: string, safetyWindowMs = 30000) {
  const expiryMs = getJwtExpiryMs(token);
  if (!expiryMs) return 0;
  return Math.max(expiryMs - Date.now() - safetyWindowMs, 0);
}

function buildDisplayName(user: BackendUser): string {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.username || user.email;
}

export function mapApiUser(user: BackendUser, fallbackRole?: User['role']): User {
  const role = (user.role?.toLowerCase() || fallbackRole || 'customer') as User['role'];
  const employmentType =
    user.employment_type === 'Part-time' ? 'Part-time' : user.employment_type ? 'Full-time' : undefined;

  return {
    id: user.id,
    username: user.username,
    name: buildDisplayName(user),
    email: user.email,
    role,
    firstName: user.first_name ?? undefined,
    lastName: user.last_name ?? undefined,
    phoneNumber: user.phone_number ?? undefined,
    dateOfBirth: user.date_of_birth ?? null,
    gender: user.gender ?? null,
    avatarUrl: user.avatar_url ?? null,
    isActive: user.is_active,
    staffCode: user.username,
    employmentType,
    height: user.height ?? null,
    weight: user.weight ?? null,
    footLength: user.foot_length ?? null,
  };
}

async function parseError(res: Response, fallbackMessage: string) {
  const data = await res.json().catch(() => ({}));
  const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (typeof firstFieldError?.[0] === 'string') return firstFieldError[0];
  return fallbackMessage;
}

async function requestUserLogin(endpoint: string, username: string, password: string) {
  const res = await fetch(`${USER_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, 'Đăng nhập thất bại'));
  }

  const response_data = await res.json();
  const payload = response_data.data;
  return {
    user: mapApiUser(payload.user),
    access: payload.access_token ?? payload.access,
    refresh: payload.refresh_token ?? payload.refresh,
  } as AuthSession;
}

async function requestManagementLogin(
  endpoint: string,
  username: string,
  password: string,
  fallbackRole?: User['role']
) {
  const res = await fetch(`${MANAGEMENT_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, 'Đăng nhập thất bại'));
  }

  const response_data = await res.json();
  const payload = response_data?.data ?? response_data;
  return {
    user: mapApiUser(payload.user, fallbackRole),
    access: payload.access_token ?? payload.access,
    refresh: payload.refresh_token ?? payload.refresh,
  } as AuthSession;
}

export async function loginUser(username: string, password: string, roleType: LoginRole = 'customer') {
  if (roleType === 'customer') {
    return requestUserLogin('/auth/login/customer/', username, password);
  }

  if (roleType === 'admin') {
    return requestManagementLogin('/auth/login/admin/', username, password, 'admin');
  }

  return requestManagementLogin('/auth/login/staff/', username, password, 'staff');
}

export async function loginAdmin(username: string, password: string) {
  return requestManagementLogin('/auth/login/admin/', username, password, 'admin');
}

export async function loginStaff(username: string, password: string) {
  return requestManagementLogin('/auth/login/staff/', username, password, 'staff');
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAccessToken() {
  return getStoredSession()?.access ?? null;
}

export function getRefreshToken() {
  return getStoredSession()?.refresh ?? null;
}

export async function logoutUser(refreshToken?: string | null) {
  const refresh = refreshToken ?? getRefreshToken();
  if (!refresh) return;

  // Best-effort: even if this fails, client will still clear local session.
  await fetch(`${USER_API_BASE}/auth/logout/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Skip-Auth-Interceptor': '1',
    },
    body: JSON.stringify({ refresh }),
  }).catch(() => undefined);
}
