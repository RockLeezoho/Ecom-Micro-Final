import type { User } from '../types';
import { getAccessToken, getStoredSession, mapApiUser, saveSession } from './authService';

const USER_API_BASE = '/api/users';

export type ShippingAddress = {
  id: string;
  address: string;
};

function mergeDefinedUserFields(base: User, patch: Partial<User>): User {
  return {
    ...base,
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
  } as User;
}

async function apiRequest(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${USER_API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
    throw new Error(
      data.error ||
        data.detail ||
        (typeof firstFieldError?.[0] === 'string' ? firstFieldError[0] : null) ||
        'Yeu cau that bai'
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function fetchCustomerProfile(): Promise<User & { shippingAddresses?: ShippingAddress[] }> {
  const data = await apiRequest('/me/customer/');
  const shippingAddresses: ShippingAddress[] = Array.isArray(data.shipping_addresses)
    ? data.shipping_addresses
    : [];
  return { ...mapApiUser(data, 'customer'), shippingAddresses };
}

export async function updateCustomerProfile(payload: {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
  height?: number | null;
  weight?: number | null;
  foot_length?: number | null;
  old_password?: string;
  password?: string;
}, avatarFile?: File): Promise<User> {
  const token = getAccessToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body: string | FormData;
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('avatar', avatarFile);
    body = formData;
  } else {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(payload);
  }

  const res = await fetch(`${USER_API_BASE}/me/customer/`, {
    method: 'PUT',
    headers,
    body,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
    throw new Error(
      data.error ||
        data.detail ||
        (typeof firstFieldError?.[0] === 'string' ? firstFieldError[0] : null) ||
        'Yeu cau that bai'
    );
  }

  if (res.status === 204) return {} as User;
  const data = await res.json();
  const updatedUser = mapApiUser(data, 'customer');
  const session = getStoredSession();

  if (session?.user) {
    const mergedUser = mergeDefinedUserFields(session.user, updatedUser);
    saveSession({ ...session, user: mergedUser });
    return mergedUser;
  }

  return updatedUser;
}

export async function listShippingAddresses(): Promise<ShippingAddress[]> {
  const data = await apiRequest('/addresses/');
  return Array.isArray(data) ? (data as ShippingAddress[]) : [];
}

export async function createShippingAddress(address: string): Promise<ShippingAddress> {
  const data = await apiRequest('/addresses/', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
  return data as ShippingAddress;
}

export async function deleteShippingAddress(id: string) {
  await apiRequest(`/addresses/${id}/`, { method: 'DELETE' });
}
