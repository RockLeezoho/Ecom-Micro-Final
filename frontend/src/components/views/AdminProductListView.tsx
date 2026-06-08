import React, { useState, useEffect, useMemo } from 'react';
import { t } from '../../utils/translate';
import { 
  Plus, Search, Trash2, Edit, Filter, 
  ChevronLeft, ChevronRight, LayoutGrid, 
  ChevronDown, Layers, Box
} from 'lucide-react';
import { Product } from '../../types';
import { fetchProducts, fetchCategories, type Category } from '../../services/productService';
import { getProductStatusLabel, getProductStatusTone, type ProductStatus } from '../../utils/productStatus';

interface AdminProductListProps {
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete?: (id: string) => void;
  products?: Product[];
}

const PAGE_SIZE_STORAGE_KEY = 'adminProductList.pageSize';

const AdminProductListView: React.FC<AdminProductListProps> = ({ onAdd, onEdit, onDelete, products: initialProducts }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State lọc: hỗ trợ lọc theo danh mục cha hoặc con
  const [filterType, setFilterType] = useState<'all' | 'parent' | 'child'>('all');
  const [filterValue, setFilterValue] = useState('all');
  // Danh sách danh mục lấy từ API
  const [categories, setCategories] = useState<Category[]>([]);
  // Lọc theo trạng thái
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === 'undefined') return 10;
    const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    return [10, 20, 50].includes(saved) ? saved : 10;
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cats, data] = await Promise.all([
          fetchCategories(),
          initialProducts && initialProducts.length > 0 ? Promise.resolve(initialProducts) : fetchProducts(),
        ]);
        setCategories(cats);
        setAllProducts(data);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialProducts]);

  /**
   * 1. Cấu trúc lại danh mục từ API: Map parentSlug -> children[]
   */
  const categoryStructure = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach((parent) => {
      map.set(parent.slug, parent.children || []);
    });
    return map;
  }, [categories]);

  /**
   * 2. Logic lọc sản phẩm theo danh mục cha
   */
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      let matchesCategory = true;
      if (filterType === 'parent') {
        // parent slug corresponds to root category mapping stored in product.category
        matchesCategory = p.category === filterValue;
      } else if (filterType === 'child') {
        // child filter compares against product.categoryId (node slug)
        matchesCategory = p.categoryId === filterValue || p.subCategory === filterValue;
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = p.status === statusFilter || (statusFilter === 'SELLING' && p.status === 'ACTIVE') || (statusFilter === 'DISCONTINUED' && p.status === 'INACTIVE');
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [allProducts, searchTerm, filterType, filterValue, statusFilter]);

  const getSubCategoryLabel = (subCategory?: string) => {
    if (!subCategory) return 'Chưa phân loại';
    return subCategory;
  };

  function getCategoryLabel(cat: string) {
    switch (cat) {
      case 'all': return 'Tất cả danh mục';
      case 'sach-luu-tru': return t('category_books');
      case 'thiet-bi-dien-tu': return t('category_electronics');
      case 'thoi-trang-may-mac': return t('category_fashion');
      default: return cat;
    }
  }

  function getOriginCountry(code?: string): string {
    const countries: Record<string, string> = {
      'VN': 'Việt Nam',
      'US': 'Hoa Kỳ',
      'CN': 'Trung Quốc',
      'JP': 'Nhật Bản',
      'KR': 'Hàn Quốc',
      'TH': 'Thái Lan',
      'DE': 'Đức',
      'FR': 'Pháp',
      'IT': 'Ý',
      'GB': 'Anh',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'ID': 'Indonesia',
      'PH': 'Philippines',
      'IN': 'Ấn Độ',
      'AU': 'Úc',
    };
    return countries[code || ''] || code || 'Chưa thiết lập';
  }

  // Xử lý khi thay đổi ô chọn lọc
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      setFilterType('all');
      setFilterValue('all');
    } else if (val.startsWith('p:')) {
      setFilterType('parent');
      setFilterValue(val.replace('p:', ''));
    } else if (val.startsWith('c:')) {
      setFilterType('child');
      setFilterValue(val.replace('c:', ''));
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('manage_inventory')}</h1>
          <p className="text-sm text-gray-500 font-medium">Quản lý kho và danh mục sản phẩm đa cấp</p>
        </div>
        <button 
          onClick={onAdd} 
          className="bg-primary text-white flex items-center justify-center gap-2 hover:bg-primary/90 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {/* Toolbar: Search & Advanced Dropdown Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Ô Tìm kiếm */}
          <div className="md:col-span-7 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium"
            />
          </div>

          {/* Ô CHỌN LỌC DANH MỤC ĐA CẤP */}
          <div className="md:col-span-5 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center gap-2 pointer-events-none group-focus-within:text-primary transition-colors">
              <Filter size={18} />
              <div className="w-[1px] h-4 bg-gray-300 ml-1"></div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 relative group">
                <select
                  value={filterType === 'all' ? 'all' : `${filterType === 'parent' ? 'p:' : 'c:'}${filterValue}`}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="all">📁 Tất cả danh mục</option>
                  {categories.map((parent) => (
                    <React.Fragment key={parent.slug}>
                      <option value={`p:${parent.slug}`} className="font-bold text-primary">📦 {parent.name}</option>
                      {parent.children?.map((child) => (
                        <option key={child.slug} value={`c:${child.slug}`} className="pl-6"> — {child.name}</option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* Status filter */}
              <div className="w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as 'all' | ProductStatus); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="NEW">{getProductStatusLabel('NEW')}</option>
                  <option value="SELLING">{getProductStatusLabel('SELLING')}</option>
                  <option value="DISCONTINUED">{getProductStatusLabel('DISCONTINUED')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Table */}
      {loading ? (
        <div className="p-24 text-center">
           <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-gray-400 font-bold italic">Đang đồng bộ dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                  <th className="px-6 py-5">Sản phẩm</th>
                  <th className="px-6 py-5">Danh mục</th>
                  <th className="px-6 py-5">Xuất xứ</th>
                  <th className="px-6 py-5">Trạng thái</th>
                  <th className="px-6 py-5 text-center">Số lượng</th>
                  <th className="px-6 py-5">Giá bán (VNĐ)</th>
                  <th className="px-6 py-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 overflow-hidden border border-gray-200 shrink-0 group-hover:border-primary/50 transition-all p-1">
                          <img src={product.image} alt="" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary uppercase bg-primary/5 px-2.5 py-1 rounded-lg w-fit">
                          📦 {getSubCategoryLabel(product.subCategory)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                        {getOriginCountry(product.origin)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em] ring-1 ${getProductStatusTone(product.status)}`}>
                        {getProductStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-lg font-black text-xs ${
                        product.stock > 10 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {product.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-900 text-base italic">
                        {product.price?.toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                        <button onClick={() => onEdit(product)} className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"><Edit size={18} /></button>
                        <button onClick={() => onDelete && onDelete(product.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-gray-100 bg-gray-50/30 gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
              Hiển thị {paginatedProducts.length} / {filteredProducts.length} mặt hàng
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => p - 1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-20 hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="bg-white border border-gray-200 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-20 hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-32 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                <LayoutGrid size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProductListView;