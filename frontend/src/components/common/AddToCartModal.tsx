import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { formatEnum } from '../../utils/translate';

interface AddToCartModalProps {
  isOpen: boolean;
  product: Product | null;
  quantity: number;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number, options: { size?: string; voltage?: number }) => void;
  actionType: 'cart' | 'buy';
}

const FASHION_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ELECTRONIC_VOLTAGES = [110, 220, 240];

const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  product,
  quantity,
  onClose,
  onConfirm,
  actionType
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedVoltage, setSelectedVoltage] = useState<number>(220);

  if (!product) return null;

  const category = String(product.category || '').toLowerCase();
  const isFashion = category.includes('thoi-trang') || category.includes('fashion');
  const isElectronics = category.includes('dien-tu') || category.includes('electronic');

  const handleConfirm = () => {
    const options: any = {};
    if (isFashion) options.size = selectedSize;
    if (isElectronics) options.voltage = selectedVoltage;
    onConfirm(product, quantity, options);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                {actionType === 'cart' ? 'Thêm vào giỏ hàng' : 'Mua ngay'}
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="flex gap-3 items-center">
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded bg-gray-50" />
                <div>
                  <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                  <p className="text-primary font-bold text-sm">{product.price.toLocaleString('vi-VN')} đ</p>
                </div>
              </div>

              {isFashion && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Chọn Kích cỡ (Size)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FASHION_SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`w-10 h-10 rounded text-sm font-bold border transition-all ${
                          selectedSize === s 
                            ? 'border-primary bg-primary-light text-primary' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isElectronics && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Chọn Điện áp (Voltage)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ELECTRONIC_VOLTAGES.map(v => (
                      <button
                        key={v}
                        onClick={() => setSelectedVoltage(v)}
                        className={`px-3 py-2 rounded text-sm font-bold border transition-all ${
                          selectedVoltage === v 
                            ? 'border-primary bg-primary-light text-primary' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {v}V
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirm}
                className="w-full py-3 mt-2 rounded-lg font-bold flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                {actionType === 'cart' ? <ShoppingCart size={18} /> : <ShoppingBag size={18} />}
                {actionType === 'cart' ? 'Xác nhận Thêm' : 'Xác nhận Mua'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddToCartModal;
