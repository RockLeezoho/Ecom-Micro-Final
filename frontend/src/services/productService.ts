import type { Product } from "../types";

type ApiProduct = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  category?: string | { slug?: string; name?: string };
  origin?: string;
  stock?: number;
  rating?: number;
  description?: string;
};

function mapCategory(rawCategory: ApiProduct["category"]): Product["category"] {
  const value =
    typeof rawCategory === "string"
      ? rawCategory
      : rawCategory?.slug || rawCategory?.name || "books";
  const normalized = String(value).toLowerCase();
  if (normalized.includes("elect")) return "electronics";
  if (normalized.includes("fashion")) return "fashion";
  return "books";
}

function mapProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    category: mapCategory(item.category),
    subCategory: "general",
    rating: Number(item.rating || 0),
    origin: item.origin || "N/A",
    image: `https://picsum.photos/seed/${item.id}/400/400`,
    description: item.description || "Chua co mo ta.",
    stock: Number(item.stock || 0),
  };
}

async function parseProductsResponse(res: Response): Promise<Product[]> {
  if (!res.ok) throw new Error("Product Service error");
  const data = await res.json();
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map(mapProduct);
}

export const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products/");
  return parseProductsResponse(res);
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  const res = await fetch(`/api/products/?category=${encodeURIComponent(category)}`);
  return parseProductsResponse(res);
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const res = await fetch(`/api/products/${id}/`);
  if (!res.ok) return null;
  const data = await res.json();
  return mapProduct(data?.data || data);
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  const res = await fetch(`/api/products/?search=${encodeURIComponent(keyword)}`);
  return parseProductsResponse(res);
};

export const healthCheckProductService = async () => {
  const res = await fetch("/api/products/health/");
  if (!res.ok) throw new Error("Product Service error");
  return res.json();
};
