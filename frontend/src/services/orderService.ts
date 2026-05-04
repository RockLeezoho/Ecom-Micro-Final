import { getAccessToken } from "./authService";

const ORDER_API_BASE = "/api/orders";

async function request(path: string, init?: RequestInit) {
  const token = getAccessToken();
  if (!token) throw new Error("Vui long dang nhap");

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${ORDER_API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || "Yeu cau that bai");
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function createOrder(payload: {
  address_id: string;
  payment_method: "COD" | "BANK_TRANSFER" | "E_WALLET" | "CREDIT_CARD";
  shipping_method: "STANDARD" | "EXPRESS";
  items: Array<{ product_id: string; quantity: number; price: number }>;
}) {
  return request("/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listOrders() {
  return request("/");
}

export async function confirmPacking(
  orderId: string,
  payload: { weight: number; length: number; width: number; height: number }
) {
  return request(`/${orderId}/confirm-packing/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
