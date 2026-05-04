import React from 'react';
import { Clock3, Mail, MapPin, MessageCircle, PhoneCall, Send } from 'lucide-react';

const ContactView: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border border-border-theme rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-3">
          <MessageCircle size={14} />
          Liên hệ BECShop
        </div>
        <h1 className="text-2xl font-black text-[#2D3748] tracking-tight mb-2">
          Chúng tôi luôn sẵn sàng hỗ trợ bạn
        </h1>
        <p className="text-sm text-[#718096]">
          Gửi câu hỏi về đơn hàng, thanh toán hoặc tư vấn sản phẩm. Đội ngũ CSKH sẽ phản hồi trong thời gian sớm nhất.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-border-theme rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <PhoneCall size={16} />
            Hotline
          </div>
          <p className="text-sm text-[#2D3748] font-black">1900 1234</p>
          <p className="text-xs text-[#718096] mt-1">Hỗ trợ 8:00 - 22:00 mỗi ngày</p>
        </div>

        <div className="bg-white border border-border-theme rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <Mail size={16} />
            Email
          </div>
          <p className="text-sm text-[#2D3748] font-black">support@becshop.vn</p>
          <p className="text-xs text-[#718096] mt-1">Phản hồi trong vòng 24 giờ</p>
        </div>

        <div className="bg-white border border-border-theme rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <MapPin size={16} />
            Văn phòng
          </div>
          <p className="text-sm text-[#2D3748] font-black">Hà Nội, Việt Nam</p>
          <p className="text-xs text-[#718096] mt-1">Tiếp nhận đối tác và doanh nghiệp</p>
        </div>
      </section>

      <section className="bg-white border border-border-theme rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-black text-[#2D3748] mb-4 uppercase tracking-wider">Gửi yêu cầu hỗ trợ</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Họ và tên"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <input
            type="text"
            placeholder="Chủ đề"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <textarea
            placeholder="Nội dung cần hỗ trợ..."
            className="md:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <div className="md:col-span-2 flex items-center justify-between">
            <div className="text-xs text-[#718096] inline-flex items-center gap-1">
              <Clock3 size={12} />
              Thời gian xử lý trung bình: 2 - 6 giờ làm việc
            </div>
            <button type="button" className="btn-dense bg-primary text-white text-xs font-bold px-4 py-2 inline-flex items-center gap-1">
              <Send size={14} />
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ContactView;
