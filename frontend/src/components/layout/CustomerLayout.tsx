import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, LogOut, Package, Settings, ShoppingBag, 
  ChevronDown, ChevronRight, BookOpen, Smartphone, Shirt, 
  Menu, User, Heart, Phone, Mail, MapPin, Grid,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, CartItem, Product } from '../../types';
import { recommendProducts } from '../../services/aiService';
import Footer from '../Footer';
import ChatAI from '../ChatAI';
import ScrollDropdown from '../views/ScrollDropDown.tsx';

interface CustomerLayoutProps {
  children: React.ReactNode;
  currentUser: UserType | null;
  cart: CartItem[];
  onLogout: () => void;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, currentUser, cart, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Lấy gợi ý sản phẩm từ AI Service khi focus hoặc nhập
  const fetchSuggestions = async (query: string) => {
    setLoadingSuggest(true);
    try {
      // Có thể truyền user_id, history nếu muốn cá nhân hóa
      const res = await recommendProducts(
        currentUser?.id || '',
        [], // history_prods
        [], // history_acts
        query || ''
      );
      // Nếu backend trả về mảng sản phẩm
      if (Array.isArray(res.products)) {
        setSuggestions(res.products);
      } else if (Array.isArray(res)) {
        setSuggestions(res);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  };
  // Xử lý focus vào search bar
  const handleSearchFocus = () => {
    setShowDropdown(true);
    fetchSuggestions(searchValue);
  };

  // Xử lý thay đổi input search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowDropdown(true);
    fetchSuggestions(value);
  };

  // Đóng dropdown khi blur khỏi input (delay để click chọn)
  const handleSearchBlur = () => {
    setTimeout(() => setShowDropdown(false), 400); // tăng delay lên 400ms
  };

  // Chọn suggestion
  const handleSuggestionClick = (product: Product) => {
    setSearchValue(product.name);
    setShowDropdown(false);
    navigate(`/product/${product.id}`);
  };

  // Đóng user dropdown khi click ra ngoài hoặc nhấn Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!isUserMenuOpen) return;
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && isUserMenuOpen) setIsUserMenuOpen(false);
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isUserMenuOpen]);

  const categories = [
      { 
        id: 'books', 
        label: 'Sách & Lưu trữ', 
        icon: BookOpen, 
        subs: ['Giáo trình', 'Tiểu thuyết', 'Truyện tranh'] 
      },
      { 
        id: 'electronics', 
        label: 'Thiết bị điện tử', 
        icon: Smartphone, 
        subs: ['Điện thoại', 'Laptop', 'Tủ lạnh'] 
      },
      { 
        id: 'fashion', 
        label: 'Thời trang & May mặc', 
        icon: Shirt, 
        subs: ['Áo', 'Quần', 'Giày dép'] 
      },
  ];
  const activePath = location.pathname;
  const urlTab = new URLSearchParams(location.search).get('tab');
  const selectedDropdownCategory =
    urlTab === 'books' || urlTab === 'electronics' || urlTab === 'fashion' ? urlTab : 'books';
  const navLinkClass = (path: string) =>
    `hover:text-primary transition-colors ${activePath === path ? 'text-primary border-b-2 border-primary pb-0.5' : ''}`;

  return (
    <div className="flex flex-col min-h-screen bg-bg-theme font-sans">
      {/* Top Utility Bar */}
      <div className="bg-primary-light/30 border-b border-border-theme h-8 hidden md:flex items-center px-6 justify-between text-[10px] font-bold text-primary">
        <div className="flex items-center gap-4 uppercase tracking-widest">
           <span className="flex items-center gap-1"><Phone size={12} /> Hỗ trợ: 1900 1234</span>
           <span className="flex items-center gap-1"><Mail size={12} /> Email: support@becshop.vn</span>
        </div>
        <div className="flex items-center gap-4">
           <span className="hover:underline cursor-pointer">Tra cứu đơn hàng</span>
           <span className="hover:underline cursor-pointer">Ghi chú vận chuyển</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white text-text-main px-6 sticky top-0 z-50 h-[72px] border-b border-border-theme shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-8">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer gap-2 font-bold text-2xl shrink-0" 
            onClick={() => navigate('/')}
          >
            <img src="/logo_becshop.png" alt="BECShop Logo" className="h-10 w-auto drop-shadow-sm" />
            <span className="tracking-tighter text-primary font-black">BEC<span className="text-accent">Shop</span></span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative w-full group">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onFocus={handleSearchFocus}
                onChange={handleSearchChange}
                onBlur={handleSearchBlur}
                placeholder="Khám phá ngay sản phẩm bạn đang tìm kiếm..."
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-full py-2 px-12 text-text-main placeholder-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm outline-none"
                autoComplete="off"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />

              {/* Dropdown suggestions */}
              {showDropdown && (suggestions.length > 0 || loadingSuggest) && (
                <div className="absolute left-0 right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto animate-fade-in">
                  {loadingSuggest ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Đang lấy gợi ý...</div>
                  ) : (
                    suggestions.map((prod) => (
                      <div
                        key={prod.id}
                        className="px-4 py-2 cursor-pointer hover:bg-primary/10 text-sm text-gray-700 flex items-center gap-2"
                        onMouseDown={() => handleSuggestionClick(prod)}
                      >
                        <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded object-cover border" />
                        <span>{prod.name}</span>
                      </div>
                    ))
                  )}
                  {!loadingSuggest && suggestions.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">Không có gợi ý phù hợp</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User & Cart Icons */}
          <div className="flex items-center gap-5 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-6">
               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors relative group">
                  <Heart size={20} />
                  <span className="text-[9px] hidden sm:block uppercase tracking-wider">Yêu thích</span>
               </div>
               
               <Link to="/cart" className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors relative group">
                  <div className="relative">
                    <ShoppingCart size={20} />
                    {cart.reduce((a, b) => a + b.quantity, 0) > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black border-2 border-white ring-2 ring-red-500/10">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] hidden sm:block uppercase tracking-wider">Giỏ hàng</span>
               </Link>

               {currentUser ? (
                 <div className="relative" ref={userMenuRef}>
                   <button
                     type="button"
                     onClick={() => setIsUserMenuOpen((v) => !v)}
                     className="flex items-center gap-2 bg-gray-50 p-1 pr-3 rounded-full border border-gray-100 shadow-sm"
                   >
                     <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black overflow-hidden text-[10px]">
                        {currentUser.avatar_url ? (
                          <img 
                            src={currentUser.avatar_url} 
                            alt={currentUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          currentUser.username[0].toUpperCase()
                        )}
                     </div>
                     <span className="text-[10px] max-w-[80px] truncate text-gray-700">{currentUser.username}</span>
                   </button>

                   <AnimatePresence>
                     {isUserMenuOpen && (
                       <motion.div
                         initial={{ opacity: 0, y: -6 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -6 }}
                         className="absolute right-0 mt-2 w-44 bg-white border border-border-theme rounded-xl shadow-lg z-50 overflow-hidden"
                       >
                         <button
                           className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                           onClick={() => { setIsUserMenuOpen(false); navigate('/account/profile'); }}
                         >
                           <User size={14} />
                           Tài khoản
                         </button>
                         <button
                           className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                           onClick={() => { setIsUserMenuOpen(false); navigate('/account/addresses'); }}
                         >
                           <MapPin size={14} />
                           Địa chỉ
                         </button>
                         <button
                           className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-500"
                           onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                         >
                           <LogOut size={14} />
                           Thoát
                         </button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               ) : (
                 <Link to="/login" className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                    <User size={20} />
                    <span className="text-[9px] hidden sm:block uppercase tracking-wider">Tài khoản</span>
                 </Link>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation Shelf */}
      <nav className="bg-white border-b border-border-theme z-40 sticky top-[72px] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center h-full">
            {/* Category Trigger */}
            <div className="relative h-full" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`h-full flex items-center gap-3 px-6 text-xs font-black uppercase tracking-widest transition-colors ${
                  isMenuOpen ? 'bg-primary text-white' : 'bg-primary text-white hover:bg-primary-light hover:text-primary'
                }`}
                type="button"
              >
                <Grid size={18} />
                <span>DANH MỤC</span>
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    {/* Overlay to close dropdown when click outside */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 top-[120px] bg-black/40 z-30"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 w-[800px] bg-white shadow-2xl z-40 border-x border-b border-border-theme rounded-b-2xl overflow-hidden shadow-primary/10"
                    >
                      <div className="grid grid-cols-3 p-8 gap-8">
                        {categories.map((cat) => (
                          <div key={cat.id}>
                            <h5 className="flex items-center gap-2 text-primary font-black text-sm mb-4 pb-2 border-b-2 border-primary-light uppercase tracking-tight">
                              <cat.icon size={18} />
                              {cat.label}
                            </h5>
                            <div className="flex flex-col gap-3">
                              {cat.subs.map(sub => (
                                <button
                                  key={sub}
                                  className="text-xs text-gray-500 hover:text-primary font-bold transition-all hover:translate-x-1 text-left"
                                  onClick={() => {
                                    setIsMenuOpen(false);
                                    navigate(`/category/${cat.id}/${encodeURIComponent(sub)}`);
                                  }}
                                >
                                  {sub}
                                </button>
                              ))}
                              <button className="text-[10px] text-accent font-black uppercase tracking-widest mt-2 hover:underline" onClick={() => setIsMenuOpen(false)}>Xem tất cả</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 p-4 px-8 border-t border-border-theme flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flash Sale</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary">Thương hiệu hot</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary">Mã giảm giá</span>
                         </div>
                         <div className="flex items-center gap-3 text-primary">
                            <FaFacebook size={16} />
                            <FaTwitter size={16} />
                            <FaInstagram size={16} />
                         </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Links */}
            <div className="flex items-center gap-8 ml-8 text-[11px] font-black uppercase tracking-widest text-[#4A5568]">
              <button className={navLinkClass('/')} onClick={() => navigate('/')}>Trang chủ</button>
              <button className="hover:text-primary transition-colors text-red-500">Giảm giá sốc</button>
              <button className={navLinkClass('/news')} onClick={() => navigate('/news')}>Tin tức</button>
              <button className={navLinkClass('/contact')} onClick={() => navigate('/contact')}>Liên hệ</button>
            </div>
          </div>

          {/* Secondary Features: Scroll Dropdown */}
          <div className="hidden lg:flex items-center gap-5 text-primary">
             <ScrollDropdown
               tabs={[
                 {
                   id: 'books',
                   label: 'Sách',
                   icon: <BookOpen size={14} />,
                 },
                 {
                   id: 'electronics',
                   label: 'Điện tử',
                   icon: <Smartphone size={14} />,
                 },
                 {
                   id: 'fashion',
                   label: 'Thời trang',
                   icon: <Shirt size={14} />,
                 },
               ]}
               value={selectedDropdownCategory}
               onSelect={(catId) => {
                 navigate(`/?tab=${encodeURIComponent(catId)}`);
               }}
               triggerLabel="Tài khoản ưu đãi"
             />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full p-6">
          {children}
        </div>
        <Footer />
        <ChatAI />
      </main>
    </div>
  );
};

export default CustomerLayout;
