import React, { useState } from 'react';
import { Product, HomepageData } from '../../types';
import { Star, ShoppingCart, Eye, Heart, Heart as HeartFilled, Filter, ChevronRight, TrendingUp, Sparkles, Award } from 'lucide-react';
import { t, formatEnum } from '../../utils/translate';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useLocation } from 'react-router-dom';

interface HomeViewProps {
  products: Product[];
  homepageData?: HomepageData | null;
  homepageLoading?: boolean;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  favoriteIds?: string[];
  toggleFavorite?: (id: string) => void | Promise<void>;
}

type TabType = 'sach-luu-tru' | 'thiet-bi-dien-tu' | 'thoi-trang-may-mac';

const ProductCard: React.FC<{ 
  product: Product, 
  onProductClick: (p: Product) => void,
  onAddToCart: (p: Product) => void,
  onBuyNow: (p: Product) => void,
  favoriteIds?: string[],
  toggleFavorite?: (id: string) => void | Promise<void>
}> = ({ product, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const isFavorite = favoriteIds.includes(product.id);
  const isOutOfStock = Number(product.stock || 0) <= 0;
  
  const getProductIcon = (category: string): string => {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('sach-luu-tru') || cat.includes('book')) return '📘';
    if (cat.includes('thiet-bi-dien-tu') || cat.includes('electronic') || cat.includes('computer')) return '💻';
    if (cat.includes('thoi-trang-may-mac') || cat.includes('fashion') || cat.includes('cloth')) return '👕';
    return '📦';
  };
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-dense flex flex-col gap-2 relative bg-white"
    >
      {/* Badge và icon yêu thích */}
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
        {product.isBestSelling && (
          <span className="flex items-center px-2 py-0.5 rounded font-extrabold uppercase text-[10px] bg-yellow-200 text-yellow-800 border border-yellow-400 shadow-sm">
            Bán chạy
          </span>
        )}
        <span className={`flex items-center px-2 py-0.5 rounded font-extrabold uppercase text-[10px] border shadow-sm ${isOutOfStock ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
          {isOutOfStock ? 'Hết hàng' : `Còn ${product.stock}`}
        </span>
      </div>
      <button
        type="button"
        className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100"
        aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        onClick={toggleFavorite ? () => toggleFavorite(product.id) : undefined}
      >
        {isFavorite ? <Heart fill="#ef4444" color="#ef4444" size={18} /> : <Heart size={18} color="#888" />}
      </button>
      <div className="h-[100px] bg-[#F7FAFC] rounded flex items-center justify-center text-3xl">
        {getProductIcon(product.category)}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-[13px] font-semibold leading-tight h-8 overflow-hidden group-hover:text-primary transition-colors cursor-pointer" onClick={() => onProductClick(product)}>
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
                <Star key={i} size={12} fill="url(#half-star)" color="#FACC15" />
              ) : (
                <Star key={i} size={12} color="#E5E7EB" />
              );
            })}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="half-star" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#FACC15" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span>{formatEnum(product.origin)}</span>
        </div>
        <div className="text-[15px] font-bold text-primary mt-auto">
          {product.price.toLocaleString('en-US')}VNĐ
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-1">
        <button 
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          className="btn-dense bg-primary-light text-primary text-[11px] py-1.5 text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? 'Hết hàng' : 'Thêm'}
        </button>
        <button 
          onClick={() => !isOutOfStock && onBuyNow(product)}
          disabled={isOutOfStock}
          className="btn-dense bg-primary text-white text-[11px] py-1.5 text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
        </button>
      </div>
    </motion.div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ products, homepageData, homepageLoading = false, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab') || 'sach-luu-tru';
  // Use tabParam directly as activeTab - no hardcoded validation
  const activeTab: TabType = tabParam as TabType;


  // Tab danh mục: Sách, Điện tử, Thời trang
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [attributeFilter, setAttributeFilter] = useState('');

  const homepageProducts = homepageData || null;
  const newProducts = homepageProducts?.new_arrivals || [];
  const suggested = homepageProducts?.recommended || [];
  const favorites = products.filter(p => favoriteIds.includes(p.id) && p.category === activeTab);
  const bestSelling = homepageProducts?.best_sellers || [];

  // Đổi tên danh mục hiển thị cho note
  const Section = ({ title, products }: { title: string, products: Product[] }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#2D3748] uppercase tracking-wider">{title}</h2>
        <span className="text-xs text-[#718096]">Đang hiển thị {products.length} sản phẩm</span>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map(p => <ProductCard key={p.id} product={p} onProductClick={onProductClick} onAddToCart={onAddToCart} onBuyNow={onBuyNow} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} />)}
        </div>
      ) : (
        <div className="bg-white rounded-lg py-8 text-center border border-border-theme border-dashed">
          <p className="text-gray-400 text-xs font-medium italic">Không có sản phẩm nào trong mục này.</p>
        </div>
      )}
    </div>
  );

  const LoadingSection = ({ title }: { title: string }) => (
    <div className="mb-8 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-100" />
        </div>
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`${title}-${index}`} className="card-dense flex flex-col gap-2 relative bg-white overflow-hidden">
            <div className="absolute top-2 left-2 h-4 w-16 rounded-full bg-gray-200" />
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-gray-200" />
            <div className="h-[100px] bg-[#F7FAFC] rounded flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-4/5 rounded bg-gray-100" />
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <div key={`${title}-${index}-star-${starIndex}`} className="h-3 w-3 rounded-sm bg-gray-100" />
                  ))}
                </div>
                <div className="h-3 w-12 rounded bg-gray-100" />
              </div>
              <div className="h-4 w-20 rounded bg-gray-200 mt-auto" />
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div className="h-6 rounded bg-gray-100" />
              <div className="h-6 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6"
        >
          {homepageLoading ? (
            <>
              <LoadingSection title="Sản phẩm mới" />
              <LoadingSection title="Gợi ý cho bạn" />
              <LoadingSection title="Được yêu thích" />
              <LoadingSection title="Sản phẩm bán chạy" />
            </>
          ) : (
            <>
              <Section title="Sản phẩm mới" products={newProducts} />
              <Section title="Gợi ý cho bạn" products={suggested} />
              <Section title="Được yêu thích" products={favorites} />
              <Section title="Sản phẩm bán chạy" products={bestSelling} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default HomeView;
