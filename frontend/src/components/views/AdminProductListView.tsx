import React, { useState, useEffect } from 'react';
import { t } from '../../utils/translate'; // Import translation helper
import { Plus, Search, Trash2, Edit } from 'lucide-react'; // Bỏ các import không dùng để tránh cảnh báo
import { Product } from '../../types';
import { listAdminProducts, deleteAdminProduct } from '../../services/adminProductService';

interface AdminProductListProps {
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete?: (id: string) => void;
  products?: Product[];
}

const AdminProductListView: React.FC<AdminProductListProps> = ({ onAdd, onEdit, onDelete, products: initialProducts }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = initialProducts && initialProducts.length > 0 ? initialProducts : await listAdminProducts();
        
        // Vì data trả về có thể khác nhau tùy API, lọc tại đây
        const serverFiltered = data.filter((p: Product) =>
          !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const filtered = activeCategory === 'all'
          ? serverFiltered
          : serverFiltered.filter((p: Product) => p.category === activeCategory);
          
        setProducts(filtered);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchTerm, activeCategory, initialProducts]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'all': return 'tất cả';
      case 'books': return 'sách';
      case 'electronics': return 'điện tử';
      case 'fashion': return 'thời trang';
      default: return cat;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-main">{t('manage_inventory')}</h1>
          <p className="text-xs text-[#718096]">{t('manage_inventory_desc')}</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-primary text-white flex items-center gap-2 hover:bg-opacity-90 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Sản phẩm mới
        </button>
      </div>

      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border border-border-theme shadow-sm">
        <div className="relative w-64">
          <input 
            type="text"
            placeholder={t('search_products_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-1.5 pl-9 pr-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
          />
          <Search className="absolute left-3 top-2 text-[#A0AEC0]" size={14} />
        </div>
        
        <div className="flex bg-[#EDF2F7] p-1 rounded-md">
          {(['all', 'books', 'electronics', 'fashion'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeCategory === cat ? 'bg-white text-primary shadow-sm' : 'text-[#718096] hover:text-primary'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">{t('loading_products')}</div>
      ) : (
        <div className="bg-white border border-border-theme rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7FAFC] border-b border-border-theme font-bold text-[#718096] uppercase tracking-wider">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Xuất xứ</th>
                <th className="px-4 py-3">Tồn kho</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3 text-right">{t('product_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#EDF2F7] transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-gray-50 overflow-hidden border border-border-theme shrink-0">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-text-main">{product.name}</div>
                        <div className="text-[10px] text-[#A0AEC0] uppercase font-bold">{product.subCategory}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-1.5 py-0.5 bg-[#EDF2F7] text-[#4A5568] rounded text-[10px] font-bold uppercase">
                        {getCategoryLabel(product.category)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#718096] font-medium">{product.origin}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="font-bold text-[#4A5568]">{product.stock}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-bold text-primary">
                    {product.price?.toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-[#A0AEC0] hover:text-primary hover:bg-blue-50 rounded transition-all"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Xóa "${product.name}"?`)) {
                            await deleteAdminProduct(product.id);
                            setProducts((prev) => prev.filter((item) => item.id !== product.id));
                          }
                        }}
                        className="p-1.5 text-[#A0AEC0] hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-10 text-center text-gray-500">{t('no_products_found')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProductListView;