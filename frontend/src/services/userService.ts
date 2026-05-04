import { getAccessToken, mapApiUser } from './authService';
import type { User } from '../types';

const USER_API_BASE = '/api/users';

type StaffPayload = {
  id?: string;
  username: string;
  email: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  employment_type: 'Full-time' | 'Part-time';
  is_active?: boolean;
  password?: string;
};

type CustomerPayload = {
  id?: string;
  username: string;
  email: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  height?: number | null;
  weight?: number | null;
  foot_length?: number | null;
  is_active?: boolean;
  password?: string;
};

async function apiRequest(path: string, init?: RequestInit, options?: { auth?: boolean }) {
  const token = options?.auth === false ? null : getAccessToken();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${USER_API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
    const errorMessage =
      data.error ||
      data.message ||
      data.detail ||
      (typeof firstFieldError?.[0] === 'string' ? firstFieldError[0] : null) ||
      'Yêu cầu thất bại';

    const error: any = new Error(errorMessage);
    error.status = data.code || res.status;
    error.body = data.errors || data;
    throw error;
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export async function fetchStaffList(): Promise<User[]> {
  const data = await apiRequest('/staffs/');
  return (data as any[]).map((item) => mapApiUser(item, 'staff'));
}

export async function createStaff(payload: StaffPayload): Promise<User> {
  const data = await apiRequest('/staffs/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiUser(data, 'staff');
}

export async function updateStaff(id: string, payload: Partial<StaffPayload>): Promise<User> {
  const data = await apiRequest(`/staffs/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapApiUser(data, 'staff');
}

export async function deleteStaff(id: string) {
  await apiRequest(`/staffs/${id}/`, {
    method: 'DELETE',
  });
}

export async function fetchCustomerList(): Promise<User[]> {
  const data = await apiRequest('/customers/');
  return (data as any[]).map((item) => mapApiUser(item, 'customer'));
}

export async function createCustomer(payload: CustomerPayload): Promise<User> {
  const data = await apiRequest('/customers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiUser(data, 'customer');
}

export async function updateCustomer(id: string, payload: Partial<CustomerPayload>): Promise<User> {
  const data = await apiRequest(`/customers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapApiUser(data, 'customer');
}

export async function deleteCustomer(id: string) {
  await apiRequest(`/customers/${id}/`, {
    method: 'DELETE',
  });
}

export async function registerCustomer(payload: {
  username: string;
  email: string;
  password: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
}) {
  // Public registration endpoint
  const res = await apiRequest('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { auth: false });

  // Expect standardized response: { status, message, data: { customer, access_token, refresh_token }, errors }
  if (!res || res.status !== 'success') {
    const errBody = res || {};
    const err: any = new Error(errBody.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    err.status = errBody.code || 400;
    err.body = errBody.errors || errBody;
    throw err;
  }

  const customer = mapApiUser(res.data.customer, 'customer');
  return {
    user: customer,
    customer,
    access: res.data.access_token,
    refresh: res.data.refresh_token,
  };
}

export type { StaffPayload, CustomerPayload };
