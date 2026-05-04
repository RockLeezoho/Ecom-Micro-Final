import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Package, ClipboardList, Truck, Boxes, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import Footer from '../Footer';
import ChatAI from '../ChatAI';

interface InternalLayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
}

const InternalLayout: React.FC<InternalLayoutProps> = ({ children, currentUser, onLogout }) => {
  const navigate = useNavigate();

  // If not staff/admin, redirect or show error (logic will be in App.tsx but layout reflects this)
  
  return (
    <div className="dashboard-grid bg-[#F4F7FA] min-h-screen">
      {/* Internal Header */}
      <header className="col-span-full bg-white border-b border-gray-200 text-gray-800 flex items-center justify-between px-6 z-50 h-14 shadow-sm">
        <div 
          className="flex items-center cursor-pointer gap-3 font-bold text-lg tracking-tight" 
          onClick={() => navigate('/portal')}
        >
          <img src="/logo_skyshop.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="text-primary font-black uppercase tracking-tight">BEC<span className="text-accent text-xs">PORTAL</span></span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-900 leading-none uppercase tracking-wide">{currentUser?.name || 'Nhân viên hệ thống'}</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">{currentUser?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
          </div>
          
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Internal Sidebar - Management focus */}
      <aside className="bg-white border-r border-border-theme p-3 flex flex-col gap-6 overflow-y-auto w-64">
        <div>
          <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#A0AEC0] mb-4 px-2">Vận hành</h4>
          <nav className="flex flex-col gap-1">
            <NavLink 
              to="/portal/orders" 
              className={({ isActive }) => 
                `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                }`
              }
            >
              <ClipboardList size={16} /> Đơn hàng chờ xử lý
            </NavLink>
            <NavLink 
              to="/portal/logistics" 
              className={({ isActive }) => 
                `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                }`
              }
            >
              <Truck size={16} /> Sổ cái & Logistics
            </NavLink>
          </nav>
        </div>

        {currentUser?.role === 'admin' && (
          <div>
            <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#A0AEC0] mb-4 px-2">Quản trị</h4>
            <nav className="flex flex-col gap-1">
              <NavLink 
                to="/portal/admin/products" 
                className={({ isActive }) => 
                  `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                  }`
                }
              >
                <Boxes size={16} /> Quản lý danh mục
              </NavLink>
              <NavLink 
                to="/portal/admin/staff" 
                className={({ isActive }) => 
                  `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                  }`
                }
              >
                <Users size={16} /> Danh bạ nhân sự
              </NavLink>
              <NavLink
                to="/portal/admin/customers"
                className={({ isActive }) =>
                  `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                  }`
                }
              >
                <Users size={16} /> Danh sách khách hàng
              </NavLink>
            </nav>
          </div>
        )}

        <div className="mt-auto px-2">
            <div className="bg-[#1A202C] p-3 rounded-lg border border-white/10 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[10px] text-white font-black uppercase">Nút bảo mật</span>
                </div>
                <p className="text-[10px] text-[#A0AEC0] font-medium leading-normal italic">
                    Môi trường truy cập hạn chế. Mọi giao dịch được ghi lại bảo mật.
                </p>
                <button 
                  onClick={() => navigate('/')}
                  className="w-full mt-3 py-1.5 border border-white/20 rounded text-[9px] text-white font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                    Trang công khai
                </button>
            </div>
        </div>
      </aside>
      
      <main className="overflow-auto bg-[#F4F7FA] flex flex-col">
        <div className="p-6 flex-1">
          {children}
        </div>
        <Footer />
        <ChatAI />
      </main>
    </div>
  );
};

export default InternalLayout;
