import { getAccessToken } from "./authService";

const USER_API_BASE = "/api/users";

async function request(path: string, init?: RequestInit) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Vui long dang nhap");
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${USER_API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || "Yeu cau that bai");
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function listFavorites(): Promise<string[]> {
  const data = await request("/favorites/");
  return Array.isArray(data) ? data.map((item: { product_id: string }) => item.product_id) : [];
}

export async function addFavorite(productId: string) {
  await request("/favorites/", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
}

export async function removeFavorite(productId: string) {
  await request(`/favorites/${productId}/`, { method: "DELETE" });
}
