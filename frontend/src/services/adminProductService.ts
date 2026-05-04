import { getAccessToken } from "./authService";
import type { Product } from "../types";

const BASE = "/api/products/admin/products/";

function mapProduct(item: any): Product {
  return {
    id: String(item.id),
    name: item.name,
    price: Number(item.price || 0),
    category: "books",
    subCategory: "general",
    rating: Number(item.rating || 0),
    origin: item.origin || "N/A",
    image: `https://picsum.photos/seed/${item.id}/400/400`,
    description: "",
    stock: Number(item.stock || 0),
  };
}

async function authRequest(path: string, init?: RequestInit) {
  const token = getAccessToken();
  if (!token) throw new Error("Vui long dang nhap");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!(init?.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || "Yeu cau that bai");
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function listAdminProducts(): Promise<Product[]> {
  const data = await authRequest("");
  const rows = Array.isArray(data) ? data : data?.results || [];
  return rows.map(mapProduct);
}

export async function createAdminProduct(payload: Partial<Product>) {
  await authRequest("", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      origin: payload.origin,
      price: payload.price,
      import_price: payload.price || 0,
      stock: payload.stock || 0,
      rating: payload.rating || 0,
      status: "ACTIVE",
      category: payload.categoryId,
    }),
  });
}

export async function updateAdminProduct(id: string, payload: Partial<Product>) {
  await authRequest(`${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      name: payload.name,
      origin: payload.origin,
      price: payload.price,
      stock: payload.stock,
      category: payload.categoryId,
    }),
  });
}

export async function deleteAdminProduct(id: string) {
  await authRequest(`${id}/`, { method: "DELETE" });
}
