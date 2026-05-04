import type { User } from '../types';
import { getAccessToken, mapApiUser } from './authService';

const USER_API_BASE = '/api/users';

export type ShippingAddress = {
  id: string;
  address: string;
};

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
}): Promise<User> {
  const data = await apiRequest('/me/customer/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  // profile update endpoint returns customer serializer subset; refetching is possible but optional
  return mapApiUser(data, 'customer');
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
