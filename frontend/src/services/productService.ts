import type { HomepageData, Product } from "../types";

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children?: ApiCategory[];
};

type ApiProduct = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  import_price?: number;
  stock?: number;
  rating?: number;
  status?: string;
  view_count?: number;
  origin?: string;
  category?: string | { id?: string; slug?: string; name?: string; children?: ApiCategory[] };
  brand?: string | { id?: string; name?: string; slug?: string } | null;
  author?: string | { id?: string; name?: string; slug?: string } | null;
  language?: string | null;
  color?: string | null;
  material?: string | null;
  description?: string;
  avatar_url?: string | null;
  images?: string[];
};

type CategoryLookupEntry = {
  rootSlug: string;
  rootName: string;
  nodeSlug: string;
  nodeName: string;
  parentSlug?: string;
  parentName?: string;
};

function normalizeSlug(value?: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function mapCategorySlug(rawValue: string): Product["category"] {
  const normalized = normalizeSlug(rawValue);
  if (normalized.includes("thiet-bi-dien-tu") || normalized.includes("elect")) return "thiet-bi-dien-tu";
  if (normalized.includes("thoi-trang-may-mac") || normalized.includes("fashion")) return "thoi-trang-may-mac";
  return "sach-luu-tru";
}

function buildCategoryLookup(categories: ApiCategory[]): Map<string, CategoryLookupEntry> {
  const lookup = new Map<string, CategoryLookupEntry>();

  const visit = (node: ApiCategory, root: ApiCategory, parent?: ApiCategory) => {
    const entry: CategoryLookupEntry = {
      rootSlug: root.slug,
      rootName: root.name,
      nodeSlug: node.slug,
      nodeName: node.name,
      parentSlug: parent?.slug,
      parentName: parent?.name,
    };

    lookup.set(normalizeSlug(node.slug), entry);
    lookup.set(normalizeSlug(node.name), entry);
    if (node.id) lookup.set(normalizeSlug(node.id), entry);

    node.children?.forEach((child) => visit(child, root, node));
  };

  categories.forEach((root) => visit(root, root));
  return lookup;
}

function getRelationLabel(value: ApiProduct["brand"] | ApiProduct["author"] | ApiProduct["category"] | ApiProduct["language"] | ApiProduct["color"] | ApiProduct["material"]) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.name || value.slug || undefined;
}

function resolveCategoryInfo(rawCategory: ApiProduct["category"], lookup: Map<string, CategoryLookupEntry>) {
  const rawSlug =
    typeof rawCategory === "string"
      ? rawCategory
      : rawCategory?.slug || rawCategory?.name || "";

  const entry = lookup.get(normalizeSlug(rawSlug));
  if (entry) {
    return {
      category: mapCategorySlug(entry.rootSlug),
      subCategory: entry.nodeName || entry.rootName || rawSlug || "Chưa phân loại",
      categoryId: entry.nodeSlug,
    };
  }

  const fallbackLabel = rawSlug || "Chưa phân loại";
  return {
    category: mapCategorySlug(fallbackLabel),
    subCategory: fallbackLabel,
    categoryId: typeof rawCategory === "string" ? rawCategory : rawCategory?.slug,
  };
}

function mapProduct(item: ApiProduct, lookup: Map<string, CategoryLookupEntry>): Product {
  const categoryInfo = resolveCategoryInfo(item.category, lookup);

  return {
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    category: categoryInfo.category,
    subCategory: categoryInfo.subCategory,
    categoryId: categoryInfo.categoryId,
    status: item.status as Product['status'],
    rating: Number(item.rating || 0),
    origin: item.origin || "N/A",
    image: item.avatar_url || `https://picsum.photos/seed/${item.id}/400/400`,
    description: item.description || "Chưa có mô tả.",
    stock: Number(item.stock || 0),
    brand: getRelationLabel(item.brand),
    author: getRelationLabel(item.author),
    language: getRelationLabel(item.language),
    color: getRelationLabel(item.color),
    material: getRelationLabel(item.material),
  };
}

// Thêm log tạm vào parseProductsResponse để verify
async function parseProductsResponse(res: Response, lookup: Map<string, CategoryLookupEntry>): Promise<Product[]> {
  if (!res.ok) throw new Error("Product Service error");
  const data = await res.json();
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  if (typeof console !== 'undefined' && console.debug) {
    try {
      console.debug(`[productService] parsed ${rows.length} product rows`);
    } catch (err) {
      // swallow debug errors - non-critical
    }
  }
  return rows.map((item) => mapProduct(item, lookup));
}

export const fetchProducts = async (): Promise<Product[]> => {
  const categories = await fetchCategories();
  const lookup = buildCategoryLookup(categories);

  const pageSize = 100;
  let page = 1;
  const allRows: ApiProduct[] = [];

  while (true) {
    const url = `/api/products/list/?page_size=${pageSize}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) break; // Out of bounds page, stop fetching
      throw new Error(`Products fetch failed: ${res.status}`);
    }
    const payload = await res.json();

    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
    allRows.push(...rows);

    // If API returns simple array, stop after first fetch.
    if (Array.isArray(payload)) break;

    // If backend includes `next` pagination field, continue while it's truthy.
    if (!payload.next) break;
    page += 1;
  }

  return allRows.map((item) => mapProduct(item as ApiProduct, lookup));
};

export const fetchProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const categories = await fetchCategories();
  const lookup = buildCategoryLookup(categories);

  const pageSize = 100;
  let page = 1;
  const allRows: ApiProduct[] = [];

  while (true) {
    const url = `/api/products/list/?category=${encodeURIComponent(categoryId)}&page_size=${pageSize}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        console.error("Không tìm thấy danh mục sản phẩm:", categoryId);
      }
      throw new Error(`Failed to fetch products for category ${categoryId}: ${res.status}`);
    }

    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
    allRows.push(...rows);

    if (Array.isArray(payload)) break;
    if (!payload.next) break;
    page += 1;
  }

  return allRows.map((item) => mapProduct(item as ApiProduct, lookup));
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const [categories, res] = await Promise.all([
    fetchCategories(),
    fetch(`/api/products/${id}/`),
  ]);
  if (!res.ok) return null;
  const data = await res.json();
  return mapProduct(data?.data || data, buildCategoryLookup(categories));
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  const products = await fetchProducts();
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return products;
  return products.filter((product) => product.name.toLowerCase().includes(normalizedKeyword));
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
    status: "SELLING",
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
    return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
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