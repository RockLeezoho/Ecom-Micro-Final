import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { Heart, Star, ShoppingBag, ArrowLeft } from 'lucide-react';
import { t, formatEnum } from '../../utils/translate';

interface FavoriteViewProps {
  products: Product[];
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

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
    <div className="card-dense flex flex-col gap-2 relative bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
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
        className="h-[120px] bg-[#F7FAFC] rounded flex items-center justify-center text-4xl cursor-pointer"
        onClick={() => onProductClick(product)}
      >
        {product.image && !product.image.includes('picsum') ? (
          <img src={product.image} alt={product.name} className="h-full object-contain" />
        ) : (
          getProductIcon(product.category as any)
        )}
      </div>

      <div className="flex flex-col gap-1 flex-1 mt-2">
        <h3
          className="text-[13px] font-semibold leading-tight h-8 overflow-hidden hover:text-primary transition-colors cursor-pointer"
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
                <Star key={i} size={12} fill="url(#half-star-fav)" color="#FACC15" />
              ) : (
                <Star key={i} size={12} color="#E5E7EB" />
              );
            })}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="half-star-fav" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#FACC15" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span>{formatEnum(product.origin)}</span>
        </div>
        <div className="text-[15px] font-bold text-primary mt-1">
          {product.price.toLocaleString('en-US')} {t('vnd_text')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
          className="bg-primary-light text-primary text-[11px] py-1.5 rounded text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
        >
          {isOutOfStock ? t('out_of_stock') : t('add')}
        </button>
        <button
          onClick={() => !isOutOfStock && onBuyNow(product)}
          disabled={isOutOfStock}
          className="bg-primary text-white text-[11px] py-1.5 rounded text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
        >
          {isOutOfStock ? t('out_of_stock') : t('buy_now')}
        </button>
      </div>
    </div>
  );
};

const FavoriteView: React.FC<FavoriteViewProps> = ({ products, favoriteIds, toggleFavorite, onAddToCart, onBuyNow, onProductClick }) => {
  const navigate = useNavigate();
  const favoriteProducts = products.filter(p => favoriteIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 md:px-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-2">
          Sản phẩm yêu thích
        </h1>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              favoriteIds={favoriteIds}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Heart size={48} color="#cbd5e1" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Bạn chưa có sản phẩm yêu thích nào</h2>
          <p className="text-gray-500 mb-8 max-w-md">Hãy thêm các sản phẩm bạn yêu thích để dễ dàng mua sắm và nhận thông báo khi có khuyến mãi nhé!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
          >
            Khám phá sản phẩm ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default FavoriteView;
