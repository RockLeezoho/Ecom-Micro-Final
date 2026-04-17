import { getCustomerToken } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_PRODUCT_API_BASE_URL ?? "http://localhost:8003/api/v1";

async function request(path, params = {}) {
  const token = getCustomerToken();
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = payload?.message ?? "Không thể tải dữ liệu sản phẩm.";
    throw new Error(message);
  }

  return payload.data;
}

export function searchProducts({ keyword, page = 1, pageSize = 20 }) {
  return request("/products/search", { keyword, page, page_size: pageSize });
}

export function getCategories() {
  return request("/catalog/categories");
}

export function getProducts(filters = {}) {
  return request("/products", {
    category: filters.category,
    min_sale_price: filters.minSalePrice,
    max_sale_price: filters.maxSalePrice,
    brand: filters.brand,
    origin: filters.origin,
    language: filters.language,
    age_group: filters.ageGroup,
    page: filters.page ?? 1,
    page_size: filters.pageSize ?? 20
  });
}

export function getProductDetail(productId) {
  return request(`/products/${productId}`);
}
