import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Package, ClipboardList, Truck, Users, BarChart3, ShieldCheck, LayoutDashboard } from 'lucide-react';
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
  const isAdmin = currentUser?.role === 'admin';
  const homePath = isAdmin ? '/portal/admin' : '/portal/staff';

  // If not staff/admin, redirect or show error (logic will be in App.tsx but layout reflects this)
  
  return (
    <div className="dashboard-grid bg-[#F4F7FA] min-h-screen">
      {/* Internal Header */}
      <header className="col-span-full bg-white border-b border-gray-200 text-gray-800 flex items-center justify-between px-6 z-50 h-14 shadow-sm">
        <div 
          className="flex items-center cursor-pointer gap-3 font-bold text-lg tracking-tight" 
          onClick={() => navigate(homePath)}
        >
          <img src="/logo_becshop.png" alt="BEC Portal Logo" className="w-8 h-8 object-contain" />
          <span className="text-primary font-black uppercase tracking-tight">BEC<span className="text-accent text-xs">PORTAL</span></span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-900 leading-none uppercase tracking-wide">{currentUser?.name || 'Nhân viên hệ thống'}</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">{isAdmin ? 'Quản trị viên' : 'Nhân viên vận hành'}</span>
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
          <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#A0AEC0] mb-4 px-2">{isAdmin ? 'Tổng quan' : 'Vận hành'}</h4>
          <nav className="flex flex-col gap-1">
            <NavLink 
              to={homePath} 
              className={({ isActive }) => 
                `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                }`
              }
            >
              <LayoutDashboard size={16} /> Trang tổng quan
            </NavLink>
            {!isAdmin && (
              <>
                <NavLink 
                  to="/portal/staff/orders" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                      isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                    }`
                  }
                >
                  <ClipboardList size={16} /> Đơn hàng chờ xử lý
                </NavLink>
                <NavLink 
                  to="/portal/staff/logistics" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                      isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                    }`
                  }
                >
                  <Truck size={16} /> Vận chuyển & bàn giao
                </NavLink>
                <NavLink 
                  to="/portal/staff/products" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                      isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                    }`
                  }
                >
                  <Package size={16} /> Quản lý sản phẩm
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#A0AEC0] mb-4 px-2">Quản trị</h4>
            <nav className="flex flex-col gap-1">
              <NavLink 
                to="/portal/admin/staff" 
                className={({ isActive }) => 
                  `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                  }`
                }
              >
                <Users size={16} /> Quản lý nhân sự
              </NavLink>
              <NavLink
                to="/portal/admin/customers"
                className={({ isActive }) =>
                  `flex items-center gap-3 text-xs font-bold p-2.5 rounded transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-text-main'
                  }`
                }
              >
                <BarChart3 size={16} /> Danh sách khách hàng
              </NavLink>
            </nav>
          </div>
        )}
      </aside>
      
      <main className="overflow-auto bg-[#F4F7FA] flex flex-col">
        <div className="p-6 flex-1">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default InternalLayout;
