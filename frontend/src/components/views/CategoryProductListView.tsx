import React, { useMemo, useState } from 'react';
import { mockProducts } from '../../data/mockData';
import { useParams } from 'react-router-dom';
import { Product } from '../../types';
import { Heart, Star } from 'lucide-react';
import { t } from '../../utils/translate';

interface CategoryProductListViewProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  favoriteIds?: string[];
  toggleFavorite?: (id: string) => void;
}

const CATEGORY_FILTERS: Record<string, { label: string; fields: { key: string; label: string; type?: string; options?: string[] }[] }> = {
  books: {
    label: t('category_books'),
    fields: [
      { key: 'origin', label: t('origin') },
      { key: 'language', label: 'Ngôn ngữ' },
      { key: 'author', label: 'Tác giả' },
      { key: 'price', label: t('price'), type: 'range' },
      { key: 'rating', label: 'Đánh giá', type: 'rating' },
    ],
  },
  electronics: {
    label: t('category_electronics'),
    fields: [
      { key: 'origin', label: t('origin') },
      { key: 'brand', label: 'Thương hiệu' },
      { key: 'color', label: 'Màu sắc' },
      { key: 'price', label: t('price'), type: 'range' },
      { key: 'rating', label: 'Đánh giá', type: 'rating' },
    ],
  },
  fashion: {
    label: t('category_fashion'),
    fields: [
      { key: 'origin', label: t('origin') },
      { key: 'brand', label: 'Thương hiệu' },
      { key: 'material', label: 'Chất liệu' },
      { key: 'price', label: t('price'), type: 'range' },
      { key: 'rating', label: 'Đánh giá', type: 'rating' },
    ],
  },
};

const SUBCATEGORY_ALIASES: Record<string, Record<string, string>> = {
  books: {
    'giao-trinh': 'textbooks',
    'tieu-thuyet': 'novels',
    'truyen-tranh': 'comics',
    'noi-tro': 'non-fiction',
    'nuoi-day-con': 'non-fiction',
  },
  electronics: {
    'dien-thoai': 'mobile phones',
    laptop: 'laptops',
    'tu-lanh': 'refrigerators',
    'may-dieu-hoa': 'air conditioners',
    'am-thanh': 'headphones',
  },
  fashion: {
    'ao-so-mi': 'shirts',
    'quan-dai': 'pants',
    'giay-dep': 'shoes',
    'tui-xach': 'bags',
    'phu-kien': 'accessories',
  },
};

const normalizeSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');

const ProductCard: React.FC<{
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  favoriteIds?: string[];
  toggleFavorite?: (id: string) => void;
}> = ({ product, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const isFavorite = favoriteIds.includes(product.id);

  return (
    <div className="card-dense flex flex-col gap-2 relative bg-white">
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
        {product.isBestSelling && (
          <span className="flex items-center px-2 py-0.5 rounded font-extrabold uppercase text-[10px] bg-yellow-200 text-yellow-800 border border-yellow-400 shadow-sm">
            {t('best_seller')}
          </span>
        )}
      </div>
      <button
        type="button"
        className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100"
        aria-label={isFavorite ? t('remove_favorite') : t('add_favorite')}
        onClick={toggleFavorite ? () => toggleFavorite(product.id) : undefined}
      >
        {isFavorite ? <Heart fill="#ef4444" color="#ef4444" size={18} /> : <Heart size={18} color="#888" />}
      </button>

      <div
        className="h-[100px] bg-[#F7FAFC] rounded flex items-center justify-center text-3xl cursor-pointer"
        onClick={() => onProductClick(product)}
      >
        {product.id.startsWith('b') ? '📘' : product.id.startsWith('e') ? '📱' : '👕'}
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <h3
          className="text-[13px] font-semibold leading-tight h-8 overflow-hidden group-hover:text-primary transition-colors cursor-pointer"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        <div className="flex justify-between items-center text-[11px] text-[#718096]">
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const full = i + 1 <= Math.floor(product.rating);
              const half = !full && i + 0.5 <= product.rating;
              return full ? (
                <Star key={i} size={12} fill="#FACC15" color="#FACC15" />
              ) : half ? (
                <Star key={i} size={12} fill="url(#half-star-category)" color="#FACC15" />
              ) : (
                <Star key={i} size={12} color="#E5E7EB" />
              );
            })}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="half-star-category" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#FACC15" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span>{product.origin}</span>
        </div>
        <div className="text-[15px] font-bold text-primary mt-auto">
            {product.price.toLocaleString('en-US')} {t('vnd_text')}
          </div>
      </div>

      <div className="grid grid-cols-2 gap-1 mt-1">
        <button
          onClick={() => onAddToCart(product)}
          className="btn-dense bg-primary-light text-primary text-[11px] py-1.5 text-center font-bold"
        >
          {t('add')}
        </button>
        <button
          onClick={() => onBuyNow(product)}
          className="btn-dense bg-primary text-white text-[11px] py-1.5 text-center font-bold"
        >
          {t('buy_now')}
        </button>
      </div>
    </div>
  );
};

const CategoryProductListView: React.FC<CategoryProductListViewProps> = ({ products, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const { categoryId = '', subCategoryId = '' } = useParams();
  const [filters, setFilters] = useState<Record<string, any>>({});

  const categoryKey = categoryId.toLowerCase();
  const filterConfig = CATEGORY_FILTERS[categoryKey];
  const decodedSubCategory = decodeURIComponent(subCategoryId);
  const normalizedSubCategory = normalizeSlug(decodedSubCategory);
  const mappedSubCategory = SUBCATEGORY_ALIASES[categoryKey]?.[normalizedSubCategory] || decodedSubCategory;
  const normalizedMappedSubCategory = normalizeSlug(mappedSubCategory);

  const filteredProducts = useMemo(() => {
    const sourceProducts = products.length > 0 ? products : mockProducts;
    const filterFn = (p: Product) => {
      if (categoryKey && p.category !== categoryKey) return false;
      if (subCategoryId && normalizeSlug(p.subCategory) !== normalizedMappedSubCategory) return false;
      for (const field of filterConfig?.fields || []) {
        const val = filters[field.key];
        if (val) {
          if (field.type === 'range' && typeof val === 'object') {
            if (val.min && p.price < val.min) return false;
            if (val.max && p.price > val.max) return false;
          } else if (field.type === 'rating') {
            if (p.rating < val) return false;
          } else if (typeof val === 'string' && val !== 'all' && p[field.key] !== val) {
            return false;
          }
        }
      }
      return true;
    };
    return sourceProducts.filter(filterFn);
  }, [products, categoryKey, subCategoryId, normalizedMappedSubCategory, filters, filterConfig]);

  if (!filterConfig) return <div className="p-8 text-center text-gray-400">{t('category_not_found')}</div>;

  // Lấy giá trị duy nhất cho các trường select từ mock hoặc products
  const getOptions = (field: string) => {
    const source = products.length > 0 ? products : mockProducts;
    return Array.from(new Set(source.filter(p => (!categoryKey || p.category === categoryKey)).map(p => p[field]).filter(Boolean)));
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 md:px-6">
      <h1 className="text-base font-bold text-primary mb-4 uppercase tracking-tight">{filterConfig.label}{subCategoryId ? ` - ${decodedSubCategory}` : ''}</h1>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0">
          <div className="bg-white rounded-2xl shadow border border-border-theme p-6 sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-primary">{t('filter_title')}</span>
              <button
                className="text-xs text-accent underline hover:text-primary"
                onClick={() => setFilters({})}
              >
                {t('clear_filters')}
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {filterConfig.fields.map((field) => {
                const isSelect = ['origin', 'brand', 'material', 'language', 'author', 'color'].includes(field.key);
                const options = isSelect ? getOptions(field.key) : [];
                // Range
                if (field.type === 'range') {
                  return (
                    <div key={field.key} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">{field.label}</div>
                      <div className="flex gap-2 items-center">
                        <input type="number" placeholder={t('range_from')} className="border border-gray-200 rounded px-3 py-1 w-20 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={filters[field.key]?.min || ''} onChange={e => setFilters(f => ({ ...f, [field.key]: { ...f[field.key], min: Number(e.target.value) } }))} />
                        <span className="text-gray-400">-</span>
                        <input type="number" placeholder={t('range_to')} className="border border-gray-200 rounded px-3 py-1 w-20 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={filters[field.key]?.max || ''} onChange={e => setFilters(f => ({ ...f, [field.key]: { ...f[field.key], max: Number(e.target.value) } }))} />
                      </div>
                    </div>
                  );
                }
                // Rating
                if (field.type === 'rating') {
                  return (
                    <div key={field.key} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">{field.label}</div>
                      <div className="flex flex-col gap-2">
                        {[5,4,3,2,1].map(r => (
                          <label key={r} className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-all ${filters[field.key] === r ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                            <input
                              type="radio"
                              name={`rating-${field.key}`}
                              className="accent-primary"
                              checked={filters[field.key] === r}
                              onChange={() => setFilters(f => ({ ...f, [field.key]: filters[field.key] === r ? '' : r }))}
                            />
                            <span className="flex gap-0.5">
                              {Array.from({ length: r }).map((_, i) => <Star key={i} size={14} fill="#FACC15" color="#FACC15" />)}
                            </span>
                            <span className="text-xs">{t('stars_or_more', { count: r })}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                // Select (radio)
                if (isSelect) {
                  return (
                    <div key={field.key} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">{field.label}</div>
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-all ${!filters[field.key] ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                          <input
                            type="radio"
                            name={`select-${field.key}`}
                            className="accent-primary"
                            checked={!filters[field.key]}
                            onChange={() => setFilters(f => ({ ...f, [field.key]: '' }))}
                          />
                          <span className="text-sm">Tất cả</span>
                        </label>
                        {options.map(opt => (
                          <label key={opt} className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-all ${filters[field.key] === opt ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                            <input
                              type="radio"
                              name={`select-${field.key}`}
                              className="accent-primary"
                              checked={filters[field.key] === opt}
                              onChange={() => setFilters(f => ({ ...f, [field.key]: opt }))}
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                // Default text
                return (
                  <div key={field.key} className="mb-4 pb-4 border-b border-gray-100">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">{field.label}</div>
                    <input type="text" className="border border-gray-200 rounded px-3 py-1 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={filters[field.key] || ''} onChange={e => setFilters(f => ({ ...f, [field.key]: e.target.value }))} placeholder={`Nhập ${field.label.toLowerCase()}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
        {/* Product Grid */}
        <section className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                favoriteIds={favoriteIds}
                toggleFavorite={toggleFavorite}
              />
            )) : <div className="col-span-full text-center text-gray-400 py-8">Không có sản phẩm phù hợp.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CategoryProductListView;
