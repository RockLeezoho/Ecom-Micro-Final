import React from 'react';
import { t } from '../../utils/translate';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { CartItem } from '../../types';

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onCheckout: () => void;
  onNavigate: (view: any) => void;
}

const CartView: React.FC<CartViewProps> = ({ 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onToggleSelect,
  onToggleSelectAll,
  onCheckout,
  onNavigate
}) => {
  const selectedItems = items.filter(item => item.selected);
  const unavailableItems = selectedItems.filter((item) => Number(item.stock || 0) <= 0 || item.quantity > Number(item.stock || 0));
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = selectedItems.length > 0 ? 5.0 : 0;
  const total = subtotal + shipping;
  const canCheckout = selectedItems.length > 0 && unavailableItems.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main flex items-center gap-3">
          <ShoppingBag className="text-primary" size={24} /> {t('my_cart')}
        </h1>
        <button 
          onClick={() => onNavigate({ type: 'HOME' })}
          className="text-primary font-bold text-xs flex items-center hover:opacity-80 transition-all gap-1"
        >
          <ChevronLeft size={14} /> {t('back_to_catalog')}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-border-theme border-dashed rounded-lg p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#F7FAFC] rounded-full flex items-center justify-center mx-auto mb-4 border border-border-theme">
            <ShoppingBag size={32} className="text-[#CBD5E0]" />
          </div>
          <h2 className="text-lg font-bold text-text-main mb-1">{t('empty_cart')}</h2>
          <p className="text-xs text-[#718096] mb-6 max-w-xs mx-auto italic">{t('empty_cart_desc')}</p>
          <button 
            onClick={() => onNavigate({ type: 'HOME' })}
            className="btn-dense bg-primary text-white hover:bg-opacity-90 transition-all uppercase tracking-wider text-[11px]"
          >
            Bắt đầu mua sắm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-3">
            {unavailableItems.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600">
                {t('cart_out_of_stock_banner') || 'Có sản phẩm hết hàng hoặc vượt quá tồn kho. Vui lòng cập nhật giỏ hàng.'}
              </div>
            )}
            <div className="bg-primary-light border border-primary/10 p-2 px-4 rounded-md flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary">
                Đã chọn: {selectedItems.length} / {items.length} sản phẩm
              </span>
              <button
                type="button"
                onClick={onToggleSelectAll}
                className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                {selectedItems.length === items.length && items.length > 0 ? 'Bỏ chọn tất cả' : t('select_all')}
              </button>
            </div>
            
            {items.map(item => (
              <motion.div 
                layout
                key={item.id}
                className={`bg-white border rounded-lg p-3 px-4 transition-all flex items-center gap-4 ${
                  item.selected ? 'border-primary ring-1 ring-primary/10 shadow-sm' : 'border-border-theme opacity-80'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => onToggleSelect(item.id)}
                  className="w-4 h-4 rounded border-[#CBD5E0] text-primary focus:ring-primary cursor-pointer"
                />
                
                <div className="w-12 h-12 bg-[#F7FAFC] rounded border border-border-theme overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-0.5">{item.subCategory}</div>
                  <h3 className="text-sm font-bold text-text-main truncate leading-tight uppercase font-mono">{item.name}</h3>
                  <p className="text-xs font-bold text-primary">{item.price.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                
                <div className="flex items-center bg-[#F7FAFC] border border-border-theme rounded p-0.5 shrink-0">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 hover:bg-white rounded transition-colors text-[#718096]"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-[11px] font-bold text-text-main">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    disabled={Number(item.stock || 0) <= 0 || item.quantity >= Number(item.stock || 0)}
                    className="p-1 hover:bg-white rounded transition-colors text-[#718096] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {Number(item.stock || 0) <= 0 ? (
                  <div className="text-[9px] font-black uppercase tracking-widest text-red-500 whitespace-nowrap">
                    {t('out_of_stock')}
                  </div>
                ) : item.quantity >= Number(item.stock || 0) ? (
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 whitespace-nowrap">
                    {t('cart_max_stock_hint') || `Chỉ còn ${Number(item.stock || 0)} sản phẩm`}
                  </div>
                ) : null}
                
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-[#A0AEC0] hover:text-red-600 hover:bg-red-50 rounded transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-border-theme rounded-lg p-5 shadow-sm sticky top-4">
              <h2 className="text-sm font-bold text-text-main mb-4 uppercase tracking-widest border-b border-border-theme pb-2">Tóm tắt thanh toán</h2>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-[#718096]">
                  <span>Tạm tính</span>
                  <span className="font-mono">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="flex justify-between text-xs text-[#718096]">
                  <span>Vận chuyển</span>
                  <span className="font-mono">{shipping.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="pt-3 border-t border-border-theme flex justify-between items-center">
                  <span className="text-xs font-bold text-text-main uppercase">Tổng cộng</span>
                  <span className="text-xl font-black text-primary font-mono">{total.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              
              <button 
                onClick={onCheckout}
                disabled={!canCheckout}
                className={`w-full py-2.5 rounded font-bold text-[11px] uppercase tracking-widest flex items-center justify-center transition-all ${
                  canCheckout 
                  ? 'bg-primary text-white hover:bg-opacity-90 shadow-sm' 
                  : 'bg-[#EDF2F7] text-[#A0AEC0] cursor-not-allowed'
                }`}
              >
                Tiến hành thanh toán <ChevronRight size={14} className="ml-1" />
              </button>
              
              <p className="mt-3 text-center text-[#A0AEC0] text-[9px] font-bold uppercase tracking-widest">
                Tiền tệ: VNĐ • Thanh toán an toàn
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
