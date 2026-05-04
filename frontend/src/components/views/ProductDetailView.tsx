import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, ShoppingCart, ShoppingBag, Heart, ChevronLeft, Truck, ShieldCheck, RefreshCw, Box } from 'lucide-react';
import { Product } from '../../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  relatedProducts: Product[];
}

const ProductDetailView: React.FC<ProductDetailProps> = ({ 
  product, 
  onBack, 
  onAddToCart, 
  onBuyNow,
  relatedProducts
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'books': return 'Sách';
      case 'electronics': return 'Điện tử';
      case 'fashion': return 'Thời trang';
      default: return cat;
    }
  };

  const getSubCategoryLabel = (sub: string) => {
    const labels: Record<string, string> = {
      'textbooks': 'Sách giáo khoa',
      'novels': 'Tiểu thuyết',
      'comics': 'Truyện tranh',
      'mobile phones': 'Điện thoại di động',
      'laptops': 'Máy tính xách tay',
      'refrigerators': 'Tủ lạnh',
      'air conditioners': 'Máy điều hòa',
      'shirts': 'Áo sơ mi',
      'pants': 'Quần',
      'shoes': 'Giày'
    };
    return labels[sub] || sub;
  };

  return (
    <div className="flex flex-col gap-6">
      <button 
        onClick={onBack}
        className="text-[#718096] font-bold text-xs flex items-center hover:text-primary transition-colors gap-1 w-fit"
      >
        <ChevronLeft size={14} /> Quay lại Danh mục
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-border-theme rounded-lg p-6 shadow-sm">
        {/* Images */}
        <div className="flex flex-col gap-4">
            <motion.div 
               layoutId={`img-${product.id}`}
               className="aspect-square bg-[#F7FAFC] rounded-lg overflow-hidden border border-border-theme"
            >
                <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-4" />
            </motion.div>
            <div className="grid grid-cols-4 gap-2">
                {[product.image, 'https://picsum.photos/seed/alt1/600/600', 'https://picsum.photos/seed/alt2/600/600', 'https://picsum.photos/seed/alt3/600/600'].map((img, i) => (
                    <button 
                        key={i}
                        onClick={() => setActiveImage(img)}
                        className={`aspect-square rounded border-2 transition-all overflow-hidden ${
                            activeImage === img ? 'border-primary' : 'border-border-theme opacity-60 hover:opacity-100'
                        }`}
                    >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex flex-col">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-2">
                <span>{getCategoryLabel(product.category)}</span>
                <span className="text-[#CBD5E0]">/</span>
                <span>{getSubCategoryLabel(product.subCategory)}</span>
            </div>
            
            <h1 className="text-2xl font-bold text-text-main leading-tight mb-2">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} strokeWidth={i < Math.floor(product.rating) ? 0 : 2} />
                    ))}
                </div>
                <span className="text-xs font-bold text-text-main">{product.rating}</span>
                <span className="text-[#CBD5E0] text-xs">|</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {product.stock > 0 ? `${product.stock} Còn hàng` : 'Hết hàng'}
                </span>
            </div>

            <div className="text-3xl font-bold text-primary mb-6">{product.price.toLocaleString('vi-VN')} VNĐ</div>
            
            <p className="text-[#4A5568] text-sm leading-relaxed mb-6 pb-6 border-b border-border-theme">
                {product.description}
            </p>

            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2.5 bg-[#F7FAFC] rounded border border-border-theme">
                        <Truck size={14} className="text-primary" />
                        <span className="text-[10px] font-bold text-[#718096] uppercase">Miễn phí vận chuyển</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-[#F7FAFC] rounded border border-border-theme">
                        <ShieldCheck size={14} className="text-primary" />
                        <span className="text-[10px] font-bold text-[#718096] uppercase">Sản phẩm chính hãng</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center bg-[#F7FAFC] border border-border-theme rounded-md p-1 w-fit">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-white rounded transition-all"><Box size={14} /></button>
                        <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-white rounded transition-all"><Box size={14} /></button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                          onClick={() => onAddToCart(product, quantity)}
                          className="flex-1 btn-dense bg-[#EDF2F7] text-[#2D3748] hover:bg-[#E2E8F0] flex items-center justify-center gap-2"
                      >
                          <ShoppingCart size={16} /> Thêm giỏ hàng
                      </button>
                      <button 
                          onClick={() => onBuyNow(product, quantity)}
                          className="flex-1 btn-dense bg-primary text-white hover:bg-opacity-90 flex items-center justify-center gap-2"
                      >
                          <ShoppingBag size={16} /> Mua ngay
                      </button>
                      <button className="p-3 bg-[#F7FAFC] text-[#CBD5E0] hover:text-red-500 border border-border-theme rounded-md transition-all">
                          <Heart size={18} />
                      </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-[#EDF2F7] rounded-lg p-6 border border-border-theme flex justify-between items-center shadow-sm">
         <div>
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Cơ sở sản xuất</h3>
            <p className="text-lg font-bold text-text-main italic">Nhập khẩu: {product.origin}</p>
         </div>
         <div className="flex gap-8">
            <div className="text-center">
                <div className="text-[10px] text-[#718096] uppercase font-bold mb-1">Tồn kho</div>
                <div className="text-sm font-bold text-text-main">{product.stock} sản phẩm</div>
            </div>
            <div className="text-center">
                 <div className="text-[10px] text-[#718096] uppercase font-bold mb-1">Chất lượng</div>
                 <div className="text-sm font-bold text-text-main">Chứng nhận 100%</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProductDetailView;
