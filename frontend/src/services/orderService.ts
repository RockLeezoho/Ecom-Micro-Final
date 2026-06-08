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
    throw new Error(data.error || data.detail || "Có lỗi xảy ra");
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function createOrder(payload: {
  address_id?: string;
  address_text?: string;
  recipient_name?: string;
  recipient_phone?: string;
  payment_method: "COD" | "BANK_TRANSFER";
  shipping_method: "STANDARD" | "EXPRESS";
  shipping_fee?: number;
  carrier_name?: string;
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

export async function confirmOrder(orderId: string, note?: string) {
  return request(`/${orderId}/confirm-order/`, {
    method: "POST",
    body: JSON.stringify({ note: note || "" }),
  });
}

export async function rejectOrder(orderId: string, note?: string) {
  return request(`/${orderId}/reject-order/`, {
    method: "POST",
    body: JSON.stringify({ note: note || "" }),
  });
}

export async function createShipment(
  orderId: string,
  payload: { weight: number; length: number; width: number; height: number }
) {
  return request(`/${orderId}/create-shipment/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function handoverToCarrier(orderId: string, carrierName: string, note?: string) {
  return request(`/${orderId}/handover-to-carrier/`, {
    method: "POST",
    body: JSON.stringify({ carrier_name: carrierName, note: note || "" }),
  });
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
