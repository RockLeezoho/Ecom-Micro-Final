import { apiGet, apiPost } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_ORDER_API_BASE_URL ?? "http://localhost:8006/api/v1";

export async function checkoutOrder(payloadBody) {
  const payload = await apiPost(API_BASE_URL, "/orders/checkout", payloadBody);
  return payload.data?.order;
}

export async function payOrder(orderId) {
  const payload = await apiPost(API_BASE_URL, `/orders/${orderId}/pay`, {});
  return payload.data?.order;
}

export async function getOrderHistory() {
  const payload = await apiGet(API_BASE_URL, "/orders");
  return payload.data?.orders ?? [];
}
