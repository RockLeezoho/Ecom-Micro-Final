import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ClipboardList, Truck, Package, Printer } from 'lucide-react';

interface StaffPortalHomeViewProps {
  pendingOrdersCount: number;
  pickupOrdersCount: number;
  productCount: number;
  handoverCount: number;
  refreshVersion?: number;
  onGoToOrders: () => void;
  onGoToLogistics: () => void;
  onGoToProducts: () => void;
  onGoToHandover: () => void;
}

const StaffPortalHomeView: React.FC<StaffPortalHomeViewProps> = ({
  pendingOrdersCount,
  pickupOrdersCount,
  productCount,
  handoverCount,
  refreshVersion,
  onGoToOrders,
  onGoToLogistics,
  onGoToProducts,
  onGoToHandover,
}) => {
  const cards = [
    {
      title: 'Đơn hàng chờ xác nhận',
      description: 'Duyệt đơn, từ chối đơn và điều phối luồng xử lý ban đầu.',
      count: pendingOrdersCount,
      icon: ClipboardList,
      action: onGoToOrders,
      accent: 'from-amber-50 to-orange-50',
      border: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Logistics & vận chuyển',
      description: 'Chọn đơn vị vận chuyển, tạo mã vận đơn và in nhãn.',
      count: pickupOrdersCount,
      icon: Truck,
      action: onGoToLogistics,
      accent: 'from-sky-50 to-cyan-50',
      border: 'border-sky-100',
      badge: 'bg-sky-100 text-sky-700',
    },
    {
      title: 'Quản lý sản phẩm',
      description: 'Thêm mới các sản phẩm sách, điện tử, thời trang.',
      count: productCount,
      icon: Package,
      action: onGoToProducts,
      accent: 'from-emerald-50 to-green-50',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Bàn giao hàng',
      description: 'Xác nhận đã bàn giao cho đơn vị vận chuyển.',
      count: handoverCount,
      icon: Printer,
      action: onGoToHandover,
      accent: 'from-violet-50 to-fuchsia-50',
      border: 'border-violet-100',
      badge: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Điều phối đơn hàng và sản phẩm</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right">
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Đơn chờ</div>
            <div className="text-2xl font-black text-gray-900">{pendingOrdersCount}</div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sản phẩm</div>
            <div className="text-2xl font-black text-gray-900">{productCount}</div>
          </div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 text-right pr-1">
            {refreshVersion ? 'Đã cập nhật sau thao tác CRUD' : 'Sẵn sàng'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.button
              type="button"
              key={`${card.title}-${refreshVersion ?? 0}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={card.action}
              className={`text-left rounded-[32px] border ${card.border} bg-gradient-to-br ${card.accent} p-6 shadow-xl shadow-gray-100 transition-transform hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <Icon size={28} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${card.badge}`}>
                  {card.count} mục
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{card.title}</h2>
              <p className="text-gray-600 text-sm leading-6 max-w-md">{card.description}</p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-black text-gray-900">
                Mở nhanh <ArrowRight size={16} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StaffPortalHomeView;