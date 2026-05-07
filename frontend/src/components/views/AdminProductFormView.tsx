import React, { useState } from 'react';
import { t } from '../../utils/translate';
import { motion } from 'motion/react';
import { ChevronLeft, Save, Image as ImageIcon, Package, Globe, Tag, DollarSign, ListOrdered } from 'lucide-react';
import { Product } from '../../types';
import { createAdminProduct, updateAdminProduct } from '../../services/adminProductService';

interface AdminProductFormProps {
  product?: Product;
  onSave?: (product: Partial<Product>) => void;
  onCancel: () => void;
}

const AdminProductFormView: React.FC<AdminProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Product>>(product || {
    name: '',
    price: 0,
    category: 'books',
    subCategory: '',
    origin: '',
    stock: 0,
    description: '',
    image: 'https://picsum.photos/seed/newproduct/400/400'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product?.id) {
      updateAdminProduct(product.id, formData).then(() => onCancel());
    } else {
      createAdminProduct(formData).then(() => onCancel());
    }
    onSave?.(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
          <button 
            onClick={onCancel}
            className="text-gray-400 font-bold text-sm flex items-center hover:text-primary transition-colors mb-4"
          >
            <ChevronLeft size={16} className="mr-1" /> {t('back_to_products')}
          </button>
        <h1 className="text-4xl font-black text-gray-900">{product ? t('edit_product') : t('create_new_product')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-primary/5 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('product_name_label')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('product_name_placeholder')}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                  required
                />
                <Package className="absolute left-4 top-4 text-primary" size={20} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('category_label')}</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900 appearance-none"
                  >
                    <option value="books">{t('category_books')}</option>
                    <option value="electronics">{t('category_electronics')}</option>
                    <option value="fashion">{t('category_fashion')}</option>
                  </select>
                  <Tag className="absolute left-4 top-4 text-primary" size={20} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('sub_category_label')}</label>
                <input
                  type="text"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder={t('sub_category_placeholder')}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('product_description_label')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('product_description_placeholder')}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900 h-32 resize-none"
                required
              />
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-blue-500/5 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('origin_label')}</label>
                <div className="relative">
                    <input
                        type="text"
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        placeholder={t('origin_placeholder')}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                        required
                    />
                    <Globe className="absolute left-4 top-4 text-primary" size={20} />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('stock_quantity_label')}</label>
                <div className="relative">
                    <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                        required
                    />
                    <ListOrdered className="absolute left-4 top-4 text-primary" size={20} />
                </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-blue-500/5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">{t('product_image_label')}</label>
                <div className="aspect-square rounded-3xl bg-gray-50 overflow-hidden mb-4 border-2 border-dashed border-gray-200 relative group">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon size={32} className="text-primary" />
                    </div>
                </div>
                <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-bold text-gray-400 focus:ring-2 focus:ring-blue-500"
                    placeholder={t('image_url_placeholder')}
                />
           </div>

           <div className="bg-primary rounded-[40px] p-8 shadow-xl shadow-primary/20 text-white">
                <label className="block text-[10px] font-black text-primary-light uppercase tracking-widest mb-3 ml-1">{t('price_label_vnd')}</label>
                <div className="relative mb-8">
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full bg-white/10 border-none rounded-2xl py-6 pl-12 pr-4 text-3xl font-black text-white focus:ring-2 focus:ring-white/30"
                        required
                    />
                    <div className="absolute left-4 top-8 text-primary-light font-bold text-lg">{t('vnd_symbol')}</div>
                </div>
                
                <button
                    type="submit"
                    className="w-full bg-white text-primary py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-primary-light transition-all flex items-center justify-center shadow-lg"
                  >
                    <Save size={20} className="mr-2" /> {t('save_changes')}
                </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductFormView;
