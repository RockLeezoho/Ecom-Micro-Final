import { apiDelete, apiGet, apiPatch, apiPost } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_CART_API_BASE_URL ?? "http://localhost:8005/api/v1";

export async function listCartItems() {
  const payload = await apiGet(API_BASE_URL, "/cart");
  return payload.data?.items ?? [];
}

export async function addCartItem({ productId, quantity = 1, selected = true }) {
  const payload = await apiPost(API_BASE_URL, "/cart/items", {
    product_id: productId,
    quantity,
    selected
  });
  return payload.data?.items ?? [];
}

export async function updateCartItemQuantity({ productId, quantity }) {
  const payload = await apiPatch(API_BASE_URL, `/cart/items/${productId}`, { quantity });
  return payload.data?.items ?? [];
}

export async function removeCartItem(productId) {
  const payload = await apiDelete(API_BASE_URL, `/cart/items/${productId}`);
  return payload.data?.items ?? [];
}

export async function clearSelectedCartItems(selectedProductIds) {
  const payload = await apiPost(API_BASE_URL, "/cart/selection/clear", {
    selected_product_ids: selectedProductIds
  });
  return payload.data?.items ?? [];
}
