import React, { useState } from 'react';
import { t } from '../../utils/translate';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Save, 
  Image as ImageIcon, 
  Package, 
  Globe, 
  Tag, 
  Layers, 
  Info,
  Box,
  X,
  Activity
} from 'lucide-react';
import { Product } from '../../types';
import { getProductStatusDot, type ProductStatus } from '../../utils/productStatus';

interface AdminProductFormProps {
  product?: Product;
  onSave?: (product: Partial<Product>) => void;
  onCancel: () => void;
}

const AdminProductFormView: React.FC<AdminProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Product & { status: ProductStatus, imageFile?: File }>>(product || {
    name: '',
    price: 0,
    category: 'sach-luu-tru',
    subCategory: '',
    origin: '',
    stock: 0,
    description: '',
    status: 'NEW', // Mặc định là mới
    image: 'https://picsum.photos/seed/newproduct/400/400'
  });

  React.useEffect(() => {
    if (product) {
      setFormData((prev) => ({ ...prev, ...product }));
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      await Promise.resolve(onSave(formData));
      return;
    }
    onCancel();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h1>
            <p className="text-sm text-gray-500">Cập nhật thông tin chi tiết và thuộc tính sản phẩm</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Save size={18} /> {t('save_changes')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
          <div className="lg:col-span-8 p-8 border-r border-gray-100 space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <Info size={18} />
              <span className="uppercase tracking-wider text-xs">Thông tin cơ bản</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Tên sản phẩm <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Package size={20} />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Laptop Apple MacBook Air M2 2022"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Danh mục chính</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="sach-luu-tru">📚 {t('category_books')}</option>
                    <option value="thiet-bi-dien-tu">💻 {t('category_electronics')}</option>
                    <option value="thoi-trang-may-mac">👕 {t('category_fashion')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Danh mục phụ</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Xuất xứ</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Số lượng tồn kho</label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Mô tả sản phẩm</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium min-h-[160px] resize-y"
              />
            </div>
          </div>

          {/* CỘT PHẢI: TRẠNG THÁI, MEDIA & GIÁ */}
          <div className="lg:col-span-4 bg-[#FAFBFC] p-8 space-y-8">
            
            {/* TRƯỜNG TRẠNG THÁI MỚI THÊM VÀO */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng thái hiển thị</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <div className={`w-2 h-2 rounded-full ${getProductStatusDot(formData.status)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></div>
                  <Activity size={18} className="text-gray-400" />
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-16 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm appearance-none cursor-pointer shadow-sm text-gray-700"
                >
                  <option value="NEW">Mới</option>
                  <option value="SELLING">Đang bán</option>
                  <option value="DISCONTINUED">Ngừng kinh doanh</option>
                </select>
              </div>
              <div className="p-3 bg-white border border-gray-100 rounded-lg">
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                  {formData.status === 'NEW' && "Sản phẩm sẽ hiển thị tag 'Mới' trên trang chủ."}
                  {formData.status === 'SELLING' && "Sản phẩm hiện đang được mở bán bình thường."}
                  {formData.status === 'DISCONTINUED' && "Sản phẩm sẽ bị ẩn khỏi cửa hàng hoặc báo hết hàng."}
                </p>
              </div>
            </div>

            {/* Hình ảnh */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Hình ảnh đại diện</label>
              </div>
              
              <div className="relative aspect-square w-full rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group shadow-sm">
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setFormData({...formData, image: '', imageFile: undefined})} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"><X size={20} /></button>
                    </div>
                  </>
                ) : (
                  <label className="text-center p-6 flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <div className="p-3 bg-primary/10 rounded-full text-primary mb-3"><ImageIcon size={28} /></div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Tải lên hình ảnh</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ 
                            ...formData, 
                            imageFile: file,
                            image: URL.createObjectURL(file) 
                          });
                        }
                      }} 
                    />
                  </label>
                )}
              </div>
              <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-[11px] font-medium text-gray-400 focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Hoặc nhập URL hình ảnh..."
              />
            </div>

            {/* Giá cả */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Thiết lập giá (VNĐ)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₫</div>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default AdminProductFormView;