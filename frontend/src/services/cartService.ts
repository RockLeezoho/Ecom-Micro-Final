import { getAccessToken } from "./authService";

const CART_API_BASE = "/api/cart";

export type ApiCartItem = {
  product_id: string;
  sales_price: string | number;
  quantity: number;
};

type ApiCartResponse = {
  items: ApiCartItem[];
};

async function request(path: string, init?: RequestInit) {
  const token = getAccessToken();
  if (!token) throw new Error("Vui long dang nhap");

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${CART_API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || data.message || "Yeu cau that bai");
  }
  if (res.status === 204) return null;
  return res.json();
}

export function hasCartSession() {
  return !!getAccessToken();
}

export async function fetchCart() {
  return request("/") as Promise<ApiCartResponse>;
}

export async function addToCart(productId: string, salesPrice: number, quantity = 1) {
  await request("/add/", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, sales_price: salesPrice, quantity }),
  });
}

export async function updateCartItem(productId: string, quantity: number) {
  await request("/update/", {
    method: "PATCH",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function removeCartItems(productIds: string[]) {
  await request("/remove/", {
    method: "DELETE",
    body: JSON.stringify({ product_ids: productIds }),
  });
}
