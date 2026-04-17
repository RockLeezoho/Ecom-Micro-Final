import { apiPost } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_PAYMENT_API_BASE_URL ?? "http://localhost:8007/api/v1";

export async function submitPayment({ orderId, paymentMethod, amount }) {
  const payload = await apiPost(API_BASE_URL, "/payments", {
    order_id: orderId,
    payment_method: paymentMethod,
    amount
  });

  return payload.data?.payment;
}
