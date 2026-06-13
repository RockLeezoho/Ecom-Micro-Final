import { getAccessToken } from "./authService";
import type { Product } from "../types";

const BASE = "/api/products/admin/products/";

function mapProduct(item: any): Product {
  const categoryValue = item.category?.slug || item.category?.name || item.category || 'books';
  const normalized = String(categoryValue).toLowerCase();
  const category = normalized.includes('elect')
    ? 'thiet-bi-dien-tu'
    : normalized.includes('fashion')
      ? 'thoi-trang-may-mac'
      : 'sach-luu-tru';
  return {
    id: String(item.id),
    name: item.name,
    price: Number(item.price || 0),
    status: item.status,
    category,
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
  if (!headers.has("Content-Type") && typeof init?.body === 'string') {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("Backend Error Data:", data);
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

export async function createAdminProduct(payload: Partial<Product> & { imageFile?: File, categoryId?: string }) {
  if (payload.imageFile) {
    const formData = new FormData();
    formData.append("name", payload.name || "");
    if (payload.origin && payload.origin !== "N/A") formData.append("origin", payload.origin);
    formData.append("price", String(payload.price || 0));
    formData.append("import_price", String(payload.price || 0));
    formData.append("stock", String(payload.stock || 0));
    formData.append("rating", String(payload.rating || 0));
    formData.append("status", payload.status || "NEW");
    if (payload.description) formData.append("description", payload.description);
    if (payload.categoryId || payload.category) {
      formData.append("category", payload.categoryId || payload.category || "");
    }
    formData.append("images", payload.imageFile);

    await authRequest("", {
      method: "POST",
      body: formData,
    });
  } else {
    await authRequest("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        origin: payload.origin === "N/A" ? null : (payload.origin || null),
        price: payload.price,
        import_price: payload.price || 0,
        stock: payload.stock || 0,
        rating: payload.rating || 0,
        status: payload.status || "NEW",
        description: payload.description,
        category: payload.categoryId || payload.category,
      }),
    });
  }
}

export async function updateAdminProduct(id: string, payload: Partial<Product> & { imageFile?: File, categoryId?: string }) {
  if (payload.imageFile) {
    const formData = new FormData();
    if (payload.name) formData.append("name", payload.name);
    if (payload.origin && payload.origin !== "N/A") formData.append("origin", payload.origin);
    if (payload.price !== undefined) formData.append("price", String(payload.price));
    if (payload.stock !== undefined) formData.append("stock", String(payload.stock));
    if (payload.categoryId || payload.category) {
      formData.append("category", payload.categoryId || payload.category || "");
    }
    if (payload.status) formData.append("status", payload.status);
    if (payload.description) formData.append("description", payload.description);
    formData.append("images", payload.imageFile);

    await authRequest(`${id}/`, {
      method: "PATCH",
      body: formData,
    });
  } else {
    await authRequest(`${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        origin: payload.origin === "N/A" ? null : (payload.origin || null),
        price: payload.price,
        stock: payload.stock,
        category: payload.categoryId || payload.category,
        status: payload.status || "NEW",
        description: payload.description,
      }),
    });
  }
}

export async function deleteAdminProduct(id: string) {
  await authRequest(`${id}/`, { method: "DELETE" });
}
