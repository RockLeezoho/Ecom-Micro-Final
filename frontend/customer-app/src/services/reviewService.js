import { apiGet, apiPost } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_REVIEW_API_BASE_URL ?? "http://localhost:8009/api/v1";

export async function submitReview({ productId, orderId, rating, content }) {
  const payload = await apiPost(API_BASE_URL, "/reviews", {
    product_id: productId,
    order_id: orderId,
    rating,
    content
  });

  return payload.data?.review;
}

export async function listProductReviews(productId) {
  const payload = await apiGet(API_BASE_URL, `/products/${productId}/reviews`);
  return payload.data?.reviews ?? [];
}
