import type { HomepageData, Product } from "../types";

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
      : rawCategory?.slug || rawCategory?.name || "sach-luu-tru";
  const normalized = String(value).toLowerCase();
  if (normalized.includes("elect")) return "thiet-bi-dien-tu";
  if (normalized.includes("fashion")) return "thoi-trang-may-mac";
  return "sach-luu-tru";
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
    description: item.description || "Chưa có mô tả.",
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

export const fetchProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const res = await fetch(`/api/products/category/${categoryId}/`); 
  
  if (!res.ok) {
    if (res.status === 404) {
      console.error("Không tìm thấy danh mục sản phẩm:", categoryId);
    }
    throw new Error('Failed to fetch products');
  }
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

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children?: Category[];
};

type ApiHomepageProduct = {
  id: string;
  name: string;
  avatar_url?: string | null;
  origin?: string;
  price?: number;
  stock?: number;
  rating?: number;
  status?: string;
};

function normalizeHomepageCategory(categoryKey: string): Product["category"] {
  if (categoryKey === "thiet-bi-dien-tu") return "thiet-bi-dien-tu";
  if (categoryKey === "thoi-trang-may-mac") return "thoi-trang-may-mac";
  return "sach-luu-tru";
}

function mapHomepageProduct(item: ApiHomepageProduct, categoryKey: string): Product {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    category: normalizeHomepageCategory(categoryKey),
    subCategory: "general",
    rating: Number(item.rating || 0),
    origin: item.origin || "N/A",
    image: item.avatar_url || `https://picsum.photos/seed/${item.id}/400/400`,
    description: "",
    stock: Number(item.stock || 0),
  };
}

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const res = await fetch("/api/categories/all/");
    if (!res.ok) throw new Error("Categories fetch error");
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
};

export const fetchHomepageProducts = async (categoryKey: string): Promise<HomepageData> => {
  const url = `/api/products/homepage/?category=${encodeURIComponent(categoryKey)}`;

  console.log('[homepage] Request', { url, categoryKey });
  const response = await fetch(url);
  console.log('[homepage] Response', { status: response.status, ok: response.ok, url: response.url });

  if (!response.ok) {
    console.error('[homepage] Request failed', { status: response.status, statusText: response.statusText });
    throw new Error('Failed to fetch homepage data');
  }

  const payload = await response.json();
  console.log('[homepage] Raw payload', payload);
  const data = payload?.data ?? payload;
  console.log('[homepage] Normalized data keys', data && typeof data === 'object' ? Object.keys(data) : data);

  const mapSection = (rows: unknown): Product[] => {
    try {
      if (!Array.isArray(rows)) return [];
      return rows.map((item) => mapHomepageProduct(item as ApiHomepageProduct, categoryKey));
    } catch (err) {
      console.error('[homepage] Failed to map section', { error: err, rows });
      return [];
    }
  };

  const result = {
    new_arrivals: mapSection(data?.new_arrivals),
    popular: mapSection(data?.popular),
    recommended: mapSection(data?.recommended),
    best_sellers: mapSection(data?.best_sellers),
  };

  console.log('[homepage] Section counts', {
    categoryKey,
    new_arrivals: result.new_arrivals.length,
    popular: result.popular.length,
    recommended: result.recommended.length,
    best_sellers: result.best_sellers.length,
  });

  return result;
};