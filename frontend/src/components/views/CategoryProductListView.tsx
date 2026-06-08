import React, { useMemo, useState } from 'react';
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
  'sach-luu-tru': {
    label: 'Sách lưu trữ',
    fields: [
      { key: 'origin', label: t('origin') },
      { key: 'language', label: 'Ngôn ngữ' },
      { key: 'author', label: 'Tác giả' },
      { key: 'price', label: t('price'), type: 'range' },
      { key: 'rating', label: 'Đánh giá', type: 'rating' },
    ],
  },
  'thiet-bi-dien-tu': {
    label: 'Thiết bị điện tử',
    fields: [
      { key: 'origin', label: t('origin') },
      { key: 'brand', label: 'Thương hiệu' },
      { key: 'price', label: t('price'), type: 'range' },
      { key: 'rating', label: 'Đánh giá', type: 'rating' },
    ],
  },
  'thoi-trang-may-mac': {
    label: 'Thời trang may mặc',
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
  const isOutOfStock = Number(product.stock || 0) <= 0;

  const getProductIcon = (category: string | { slug?: string, name?: string }): string => {
    let catStr = '';
    if (typeof category === 'string') {
      catStr = category;
    } else if (category) {
      catStr = category.slug || category.name || '';
    }
    const cat = catStr.toLowerCase();
    if (cat.includes('sach') || cat.includes('book')) return '📘';
    if (cat.includes('dien') || cat.includes('electronic') || cat.includes('computer')) return '💻';
    if (cat.includes('thoi') || cat.includes('fashion') || cat.includes('cloth')) return '👕';
    return '📦';
  };

  return (
    <div className="card-dense flex flex-col gap-2 relative bg-white">
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
        {product.isBestSelling && (
          <span className="flex items-center px-2 py-0.5 rounded font-extrabold uppercase text-[10px] bg-yellow-200 text-yellow-800 border border-yellow-400 shadow-sm">
            {t('best_seller')}
          </span>
        )}
        <span className={`flex items-center px-2 py-0.5 rounded font-extrabold uppercase text-[10px] border shadow-sm ${isOutOfStock ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
          {isOutOfStock ? t('out_of_stock') : `${t('stock_label')}: ${product.stock}`}
        </span>
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
        {getProductIcon(product.category as any)}
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
          <span>{formatFilterValue(product.origin)}</span>
        </div>
        <div className="text-[15px] font-bold text-primary mt-auto">
            {product.price.toLocaleString('en-US')} {t('vnd_text')}
          </div>
      </div>

      <div className="grid grid-cols-2 gap-1 mt-1">
        <button
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          className="btn-dense bg-primary-light text-primary text-[11px] py-1.5 text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? t('out_of_stock') : t('add')}
        </button>
        <button
          onClick={() => !isOutOfStock && onBuyNow(product)}
          disabled={isOutOfStock}
          className="btn-dense bg-primary text-white text-[11px] py-1.5 text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? t('out_of_stock') : t('buy_now')}
        </button>
      </div>
    </div>
  );
};

const FILTER_VALUE_TRANSLATIONS: Record<string, string> = {
  // Origin
  'VN': 'Việt Nam', 'Origin.VIETNAM': 'Việt Nam',
  'CN': 'Trung Quốc', 'Origin.CHINA': 'Trung Quốc',
  'US': 'Mỹ', 'Origin.USA': 'Mỹ',
  'JP': 'Nhật Bản', 'Origin.JAPAN': 'Nhật Bản',
  'KR': 'Hàn Quốc', 'Origin.KOREA': 'Hàn Quốc',
  'GB': 'Anh', 'Origin.UK': 'Anh',
  'FR': 'Pháp', 'Origin.FRANCE': 'Pháp',
  'TH': 'Thái Lan', 'Origin.THAILAND': 'Thái Lan',
  
  // Language
  'vi': 'Tiếng Việt', 'Language.VIETNAMESE': 'Tiếng Việt',
  'en': 'Tiếng Anh', 'Language.ENGLISH': 'Tiếng Anh',
  'ja': 'Tiếng Nhật', 'Language.JAPANESE': 'Tiếng Nhật',
  'zh': 'Tiếng Trung', 'Language.CHINESE': 'Tiếng Trung',
  'fr': 'Tiếng Pháp', 'Language.FRENCH': 'Tiếng Pháp',
  
  // Color
  'WHITE': 'Trắng', 'Color.WHITE': 'Trắng',
  'BLACK': 'Đen', 'Color.BLACK': 'Đen',
  'GRAY': 'Xám', 'Color.GRAY': 'Xám',
  'RED': 'Đỏ', 'Color.RED': 'Đỏ',
  'BLUE': 'Xanh dương', 'Color.BLUE': 'Xanh dương',
  'GREEN': 'Xanh lá', 'Color.GREEN': 'Xanh lá',
  'YELLOW': 'Vàng', 'Color.YELLOW': 'Vàng',
  'PINK': 'Hồng', 'Color.PINK': 'Hồng',
  'PURPLE': 'Tím', 'Color.PURPLE': 'Tím',
  'BROWN': 'Nâu', 'Color.BROWN': 'Nâu',
  'MULTI-COLOR': 'Nhiều màu', 'Color.MULTI': 'Nhiều màu',
  
  // Material
  'COTTON': 'Cotton', 'Material.COTTON': 'Cotton',
  'LEATHER': 'Da', 'Material.LEATHER': 'Da',
  'POLYESTER': 'Polyester', 'Material.POLYESTER': 'Polyester',

  // Gender
  'MALE': 'Nam', 'Gender.MALE': 'Nam',
  'FEMALE': 'Nữ', 'Gender.FEMALE': 'Nữ',
  'UNISEX': 'Unisex', 'Gender.UNISEX': 'Unisex',

  // Season
  'SPRING': 'Mùa xuân', 'Season.SPRING': 'Mùa xuân',
  'SUMMER': 'Mùa hè', 'Season.SUMMER': 'Mùa hè',
  'AUTUMN': 'Mùa thu', 'Season.AUTUMN': 'Mùa thu',
  'WINTER': 'Mùa đông', 'Season.WINTER': 'Mùa đông',

  // Condition
  'NEW': 'Mới', 'Condition.NEW': 'Mới',
  'OPEN_BOX': 'Hàng khui hộp', 'Condition.OPEN_BOX': 'Hàng khui hộp',
  'REFURBISHED': 'Hàng tân trang', 'Condition.REFURBISHED': 'Hàng tân trang'
};

const formatFilterValue = (val: string) => FILTER_VALUE_TRANSLATIONS[val] || val;

const CategoryProductListView: React.FC<CategoryProductListViewProps> = ({ products, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const { categoryId = '', subCategoryId = '' } = useParams();
  const [filters, setFilters] = useState<Record<string, any>>({});

  const categoryKey = categoryId.toLowerCase();
  const filterConfig = CATEGORY_FILTERS[categoryKey];
  const decodedSubCategory = decodeURIComponent(subCategoryId);
  const normalizedSubCategory = normalizeSlug(decodedSubCategory);

  const filteredProducts = useMemo(() => {
    const sourceProducts = products;
    const filterFn = (p: Product) => {
      if (categoryKey && p.category !== categoryKey) return false;
      if (subCategoryId && p.categoryId !== subCategoryId && normalizeSlug(p.subCategory) !== normalizedSubCategory) return false;
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
  }, [products, categoryKey, subCategoryId, normalizedSubCategory, filters, filterConfig]);

  if (!filterConfig) return <div className="p-8 text-center text-gray-400">{t('category_not_found')}</div>;

  // Lấy giá trị duy nhất cho các trường select từ products
  const getOptions = (field: string) => {
    const source = products;
    return Array.from(new Set(source.filter(p => (!categoryKey || p.category === categoryKey)).map(p => p[field]).filter(Boolean)));
  };

  const subCategoryName = useMemo(() => {
    if (!subCategoryId) return '';
    const match = products.find(p => p.categoryId === subCategoryId || normalizeSlug(p.subCategory) === normalizedSubCategory);
    return match ? match.subCategory : decodedSubCategory;
  }, [products, subCategoryId, normalizedSubCategory, decodedSubCategory]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 md:px-6">
      <h1 className="text-base font-bold text-primary mb-4 uppercase tracking-tight">{filterConfig.label}{subCategoryId ? ` - ${subCategoryName}` : ''}</h1>
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
                        <div className="relative">
                          <input type="number" placeholder={t('range_from')} className="border border-gray-200 rounded pl-2 pr-10 py-1 w-24 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm" value={filters[field.key]?.min ? filters[field.key].min / 1000 : ''} onChange={e => setFilters(f => ({ ...f, [field.key]: { ...f[field.key], min: e.target.value ? Number(e.target.value) * 1000 : undefined } }))} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">.000đ</span>
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative">
                          <input type="number" placeholder={t('range_to')} className="border border-gray-200 rounded pl-2 pr-10 py-1 w-24 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm" value={filters[field.key]?.max ? filters[field.key].max / 1000 : ''} onChange={e => setFilters(f => ({ ...f, [field.key]: { ...f[field.key], max: e.target.value ? Number(e.target.value) * 1000 : undefined } }))} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">.000đ</span>
                        </div>
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
                            <span className="text-sm">{formatFilterValue(String(opt))}</span>
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
