import React, { useState } from 'react';
import { Product } from '../../types';
import { Star, ShoppingCart, Eye, Heart, Heart as HeartFilled, Filter, ChevronRight, TrendingUp, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

interface HomeViewProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  favoriteIds?: string[];
  toggleFavorite?: (id: string) => void | Promise<void>;
}

type TabType = 'books' | 'electronics' | 'fashion';

const ProductCard: React.FC<{ 
  product: Product, 
  onProductClick: (p: Product) => void,
  onAddToCart: (p: Product) => void,
  onBuyNow: (p: Product) => void,
  favoriteIds?: string[],
  toggleFavorite?: (id: string) => void | Promise<void>
}> = ({ product, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const isFavorite = favoriteIds.includes(product.id);
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
        {product.id.startsWith('b') ? '📘' : product.id.startsWith('e') ? '📱' : '👕'}
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
          <span>{product.origin}</span>
        </div>
        <div className="text-[15px] font-bold text-primary mt-auto">
          {product.price.toLocaleString('en-US')}VNĐ
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-1">
        <button 
          onClick={() => onAddToCart(product)}
          className="btn-dense bg-primary-light text-primary text-[11px] py-1.5 text-center font-bold"
        >
          Thêm
        </button>
        <button 
          onClick={() => onBuyNow(product)}
          className="btn-dense bg-primary text-white text-[11px] py-1.5 text-center font-bold"
        >
          Mua ngay
        </button>
      </div>
    </motion.div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ products, onProductClick, onAddToCart, onBuyNow, favoriteIds = [], toggleFavorite }) => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const activeTab: TabType = tabParam === 'books' || tabParam === 'electronics' || tabParam === 'fashion'
    ? tabParam
    : 'books';


  // Tab danh mục: Sách, Điện tử, Thời trang
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [originFilter, setOriginFilter] = useState('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [attributeFilter, setAttributeFilter] = useState('');

  const subcategories = Array.from(new Set(products.filter((p) => p.category === activeTab).map((p) => p.subCategory)));
  const origins = Array.from(new Set(products.filter((p) => p.category === activeTab).map((p) => p.origin)));

  const filteredProducts = products.filter(p => {
    if (p.category !== activeTab) return false;
    if (filterCategory !== 'all' && p.subCategory !== filterCategory) return false;
    if (p.rating < filterRating) return false;
    if (searchKeyword && !p.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    if (originFilter !== 'all' && p.origin !== originFilter) return false;
    if (minPrice > 0 && p.price < minPrice) return false;
    if (maxPrice > 0 && p.price > maxPrice) return false;
    if (attributeFilter && !`${p.name} ${p.description}`.toLowerCase().includes(attributeFilter.toLowerCase())) return false;
    return true;
  });

  // Sản phẩm mới: lấy theo createdAt (nếu có), nếu không có thì lấy theo id mới nhất (giả lập)
  const sortedByNew = [...filteredProducts].sort((a, b) => {
    // Ưu tiên trường createdAt, nếu không có thì so sánh id (giả lập)
    if ((a as any).createdAt && (b as any).createdAt) {
      return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
    }
    // fallback: id dạng p+timestamp hoặc b1, b2, e1, e2, f1, f2
    return b.id.localeCompare(a.id);
  });
  const newProducts = sortedByNew.slice(0, 8);

  const suggested = filteredProducts.filter(p => p.isSuggested);
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const bestSelling = filteredProducts.filter(p => p.isBestSelling);

  // Đổi tên danh mục hiển thị cho note
  const getTabLabel = (tab: TabType) => {
    switch(tab) {
      case 'books': return 'Sách';
      case 'electronics': return 'Điện tử';
      case 'fashion': return 'Thời trang';
    }
  };

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
          <Section title="Sản phẩm mới" products={newProducts} />
          <Section title="Gợi ý cho bạn" products={suggested} />
          <Section title="Được yêu thích" products={favorites} />
          <Section title="Sản phẩm bán chạy" products={bestSelling} />
        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default HomeView;
