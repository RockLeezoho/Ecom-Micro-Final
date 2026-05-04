import React from 'react';
import { ShoppingBag, Facebook, Twitter, Instagram, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A202C] text-white py-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-bold text-xl">
            <img src="/logo_becshop.png" alt="BECShop Logo" className="w-8 h-8 object-contain brightness-0 invert" />
            <span className="tracking-tighter">BECShop</span>
          </div>
          <p className="text-xs text-[#A0AEC0] leading-relaxed font-medium">
            Nền tảng thương mại điện tử hàng đầu cung cấp sản phẩm chất lượng cao, từ công nghệ đến thời trang. Trải nghiệm mua sắm an toàn và nhanh chóng.
          </p>
          <div className="flex items-center gap-4">
            <Facebook size={18} className="text-[#A0AEC0] hover:text-primary cursor-pointer transition-colors" />
            <Twitter size={18} className="text-[#A0AEC0] hover:text-primary cursor-pointer transition-colors" />
            <Instagram size={18} className="text-[#A0AEC0] hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.2em] font-black text-white mb-6">Liên kết hữu ích</h4>
          <ul className="space-y-3 text-xs text-[#A0AEC0] font-bold">
            <li className="hover:text-primary cursor-pointer transition-colors">Về chúng tôi</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Chính sách bảo mật</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Điều khoản dịch vụ</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Câu hỏi thường gặp</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.2em] font-black text-white mb-6">Pháp lý</h4>
          <ul className="space-y-3 text-xs text-[#A0AEC0] font-bold">
            <li className="hover:text-primary cursor-pointer transition-colors">Chính sách hoàn tiền</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Chính sách vận chuyển</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Tranh chấp & Khiếu nại</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.2em] font-black text-white mb-6">Liên hệ</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-xs text-[#A0AEC0] font-bold">
              <MapPin size={16} className="text-primary shrink-0" />
              <span>123 Đường Công Nghệ, Quận 1, TP. Hà Nội, Việt Nam</span>
            </li>
            <li className="flex items-center gap-3 text-xs text-[#A0AEC0] font-bold">
              <Phone size={16} className="text-primary shrink-0" />
              <span>+84 (0) 123 456 789</span>
            </li>
            <li className="flex items-center gap-3 text-xs text-[#A0AEC0] font-bold">
              <Mail size={16} className="text-primary shrink-0" />
              <span>support@becshop.vn</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-[#718096] font-bold uppercase tracking-widest">
          &copy; 2024 BECShop Commerce. Bảo lưu mọi quyền.
        </p>
        <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[9px] text-[#718096] font-black uppercase tracking-widest leading-none">Hệ thống bảo mật AES-256</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
