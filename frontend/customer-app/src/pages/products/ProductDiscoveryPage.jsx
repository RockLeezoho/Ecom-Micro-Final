import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { CategoryCard } from "../../components/product/CategoryCard";
import { FilterPanel } from "../../components/product/FilterPanel";
import { ProductGrid } from "../../components/product/ProductGrid";
import { SearchBar } from "../../components/product/SearchBar";
import { trackBehaviorEvent } from "../../services/aiService";
import { addCartItem } from "../../services/cartService";
import { getCategories, getProducts, searchProducts } from "../../services/productService";

const defaultFilters = {
  minSalePrice: "",
  maxSalePrice: "",
  brand: "",
  origin: "",
  language: "",
  ageGroup: ""
};

export function ProductDiscoveryPage() {
  const [keyword, setKeyword] = useState("");
  const [activeKeyword, setActiveKeyword] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingCart, setSubmittingCart] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");
        const [categoryData, productData] = await Promise.all([getCategories(), getProducts({ page: 1 })]);
        setCategories(categoryData.items ?? []);
        setProducts(productData.items ?? []);
        setPagination(productData.pagination ?? { page: 1, page_size: 20, total: 0 });
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const hasFilter = useMemo(() => {
    return Boolean(
      selectedCategory ||
        filters.minSalePrice ||
        filters.maxSalePrice ||
        filters.brand ||
        filters.origin ||
        filters.language ||
        filters.ageGroup
    );
  }, [filters, selectedCategory]);

  async function loadProducts({ page = 1, search = activeKeyword } = {}) {
    try {
      setLoading(true);
      setError("");
      if (search) {
        const data = await searchProducts({
          keyword: search,
          page,
          pageSize: pagination.page_size
        });
        setProducts(data.items ?? []);
        setPagination(data.pagination ?? { page: 1, page_size: 20, total: 0 });
        return;
      }

      const data = await getProducts({
        category: selectedCategory,
        minSalePrice: filters.minSalePrice || undefined,
        maxSalePrice: filters.maxSalePrice || undefined,
        brand: filters.brand || undefined,
        origin: filters.origin || undefined,
        language: filters.language || undefined,
        ageGroup: filters.ageGroup || undefined,
        page,
        pageSize: pagination.page_size
      });
      setProducts(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, page_size: 20, total: 0 });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  function onFilterChange(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function onApplyFilters() {
    setActiveKeyword("");
    setKeyword("");
    await loadProducts({ page: 1, search: "" });
  }

  async function onClearFilters(nextDefault) {
    setFilters(nextDefault);
    setSelectedCategory("");
    setActiveKeyword("");
    setKeyword("");
    try {
      setLoading(true);
      const data = await getProducts({ page: 1 });
      setProducts(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, page_size: 20, total: 0 });
      setError("");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitSearch(event) {
    event.preventDefault();
    const normalized = keyword.trim();
    if (!normalized) {
      return;
    }
    setActiveKeyword(normalized);
    setSelectedCategory("");
    trackBehaviorEvent({
      event_type: "search",
      search_keyword: normalized
    });
    await loadProducts({ page: 1, search: normalized });
  }

  async function onSelectCategory(categorySlug) {
    const isCurrent = categorySlug === selectedCategory;
    setSelectedCategory(isCurrent ? "" : categorySlug);
    setActiveKeyword("");
    setKeyword("");
    if (!isCurrent) {
      trackBehaviorEvent({
        event_type: "category_view",
        category_id: categorySlug
      });
    }
    try {
      setLoading(true);
      const data = await getProducts({
        category: isCurrent ? undefined : categorySlug,
        minSalePrice: filters.minSalePrice || undefined,
        maxSalePrice: filters.maxSalePrice || undefined,
        brand: filters.brand || undefined,
        origin: filters.origin || undefined,
        language: filters.language || undefined,
        ageGroup: filters.ageGroup || undefined,
        page: 1
      });
      setProducts(data.items ?? []);
      setPagination(data.pagination ?? { page: 1, page_size: 20, total: 0 });
      setError("");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  async function onChangePage(page) {
    await loadProducts({ page });
  }

  async function onAddToCart(product) {
    try {
      setSubmittingCart(true);
      setError("");
      setSubmitSuccess("");
      await addCartItem({ productId: product.id, quantity: 1 });
      trackBehaviorEvent({
        event_type: "add_to_cart",
        product_id: product.id,
        category_id: product.category_slug,
        price: Number(product.sale_price),
        quantity: 1
      });
      setSubmitSuccess(`Đã thêm ${product.name} vào giỏ hàng.`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmittingCart(false);
    }
  }

  function onViewProduct(product) {
    trackBehaviorEvent({
      event_type: "product_click",
      product_id: product.id,
      category_id: product.category_slug,
      price: Number(product.sale_price)
    });
  }

  return (
    <section className="product-content">
      <SearchBar value={keyword} onChange={setKeyword} onSubmit={onSubmitSearch} loading={loading} />
      <ErrorAlert message={error} />
      {submitSuccess ? <p className="submit-success">{submitSuccess}</p> : null}

      <section className="category-section">
        <h2>Danh mục</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              selected={selectedCategory === category.slug}
              onSelect={onSelectCategory}
            />
          ))}
        </div>
      </section>

      <FilterPanel
        filters={filters}
        onChange={onFilterChange}
        onApply={onApplyFilters}
        onClear={onClearFilters}
        loading={loading}
      />

      {loading ? <LoadingState /> : null}
      {!loading && !error && products.length === 0 ? (
        <EmptyState
          message={
            hasFilter || activeKeyword
              ? "Không tìm thấy sản phẩm phù hợp với điều kiện hiện tại."
              : "Chưa có sản phẩm khả dụng."
          }
        />
      ) : null}
      {!loading && !error && products.length > 0 ? (
        <ProductGrid
          products={products}
          onAddToCart={onAddToCart}
          onViewProduct={onViewProduct}
          actionDisabled={submittingCart}
        />
      ) : null}

      <footer className="pagination-row">
        <button
          type="button"
          className="secondary-btn"
          disabled={loading || pagination.page <= 1}
          onClick={() => onChangePage(pagination.page - 1)}
        >
          Trang trước
        </button>
        <span>
          Trang {pagination.page} / {Math.max(1, Math.ceil((pagination.total || 0) / (pagination.page_size || 20)))}
        </span>
        <button
          type="button"
          className="secondary-btn"
          disabled={loading || pagination.page * pagination.page_size >= pagination.total}
          onClick={() => onChangePage(pagination.page + 1)}
        >
          Trang sau
        </button>
      </footer>
    </section>
  );
}
