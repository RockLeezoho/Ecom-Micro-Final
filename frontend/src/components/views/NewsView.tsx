import React from 'react';
import { CalendarDays, ChevronRight, Newspaper, Sparkles, Tag } from 'lucide-react';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  highlight?: boolean;
};

const newsItems: NewsItem[] = [
  {
    id: 'n1',
    title: 'Ra mắt bộ sưu tập sách công nghệ tháng 5',
    summary: 'Hơn 200 đầu sách mới về lập trình, thiết kế hệ thống và AI đã có mặt tại BECShop với ưu đãi đặc biệt.',
    date: '01/05/2026',
    category: 'Sản phẩm mới',
    highlight: true,
  },
  {
    id: 'n2',
    title: 'Miễn phí giao hàng toàn quốc cho đơn từ 299K',
    summary: 'Chương trình áp dụng cho tất cả khách hàng từ hôm nay đến hết tháng, bao gồm cả đơn hàng flash sale.',
    date: '30/04/2026',
    category: 'Khuyến mãi',
  },
  {
    id: 'n3',
    title: 'Nâng cấp hệ thống đóng gói: nhanh hơn 20%',
    summary: 'Trung tâm vận hành mới giúp xử lý đơn nhanh hơn, tăng tốc độ giao hàng ở cả 3 miền.',
    date: '28/04/2026',
    category: 'Vận hành',
  },
  {
    id: 'n4',
    title: 'Mẹo chọn thiết bị điện tử phù hợp nhu cầu',
    summary: 'Đội ngũ chuyên gia chia sẻ checklist 5 bước giúp bạn chọn đúng sản phẩm và tối ưu chi phí.',
    date: '25/04/2026',
    category: 'Cẩm nang',
  },
];

const NewsView: React.FC = () => {
  const featured = newsItems[0];
  const others = newsItems.slice(1);

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border border-border-theme rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Newspaper size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Tin tức BECShop</span>
        </div>
        <h1 className="text-2xl font-black text-[#2D3748] tracking-tight mb-2">
          Cập nhật mới nhất về sản phẩm, khuyến mãi và vận hành
        </h1>
        <p className="text-sm text-[#718096]">
          Theo dõi thông báo mới để không bỏ lỡ ưu đãi và các cải tiến dịch vụ dành cho bạn.
        </p>
      </section>

      <section className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest mb-3">
          <Sparkles size={14} />
          Tin nổi bật
        </div>
        <h2 className="text-xl font-black text-[#2D3748] mb-3">{featured.title}</h2>
        <p className="text-sm text-[#4A5568] mb-4">{featured.summary}</p>
        <div className="flex items-center gap-4 text-xs text-[#718096]">
          <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {featured.date}</span>
          <span className="inline-flex items-center gap-1"><Tag size={14} /> {featured.category}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {others.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-border-theme rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-primary mb-2">
              <Tag size={12} />
              {item.category}
            </div>
            <h3 className="text-sm font-bold text-[#2D3748] mb-2 leading-snug">{item.title}</h3>
            <p className="text-xs text-[#718096] mb-3 leading-relaxed">{item.summary}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#A0AEC0] inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {item.date}
              </span>
              <button className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1">
                Xem thêm <ChevronRight size={12} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default NewsView;
