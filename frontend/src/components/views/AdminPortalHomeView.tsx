import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Users, UserRound, Shield } from 'lucide-react';

interface AdminPortalHomeViewProps {
  staffCount: number;
  customerCount: number;
  refreshVersion?: number;
  onGoToStaff: () => void;
  onGoToCustomers: () => void;
}

const AdminPortalHomeView: React.FC<AdminPortalHomeViewProps> = ({
  staffCount,
  customerCount,
  refreshVersion,
  onGoToStaff,
  onGoToCustomers,
}) => {
  const cards = [
    {
      title: 'Quản lý staff',
      description: 'Thêm mới nhân viên vận hành, phân quyền truy cập và hồ sơ làm việc.',
      count: staffCount,
      icon: Users,
      action: onGoToStaff,
      accent: 'from-slate-50 to-gray-50',
      border: 'border-slate-200',
      badge: 'bg-slate-100 text-slate-700',
    },
    {
      title: 'Quản lý customer',
      description: 'Thêm mới khách hàng, kích hoạt hoặc khóa tài khoản và thông tin liên hệ.',
      count: customerCount,
      icon: UserRound,
      action: onGoToCustomers,
      accent: 'from-rose-50 to-pink-50',
      border: 'border-rose-100',
      badge: 'bg-rose-100 text-rose-700',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">Admin workspace</p>
          <h1 className="text-4xl font-black text-gray-900">Quản trị staff và khách hàng</h1>
          <p className="mt-3 text-gray-500 max-w-2xl">
            Trang làm việc dành cho quản trị viên: tập trung vào tài khoản staff, tài khoản customer và kiểm soát hệ thống.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bảo mật</div>
          <div className="flex items-center gap-2 text-sm font-black text-gray-900 mt-1">
            <Shield size={16} className="text-primary" /> Chỉ admin truy cập
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 text-right">
            {refreshVersion ? 'Đã cập nhật' : 'Sẵn sàng'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={`${card.title}-${refreshVersion ?? 0}`}
              type="button"
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

export default AdminPortalHomeView;