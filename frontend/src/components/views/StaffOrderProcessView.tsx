import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, CheckCircle2, XCircle, PlusCircle, Eye } from 'lucide-react';
import { Order } from '../../types';

interface StaffOrderProcessProps {
  orders: Order[];
  onConfirm: (orderId: string, allowed: boolean) => void;
  onConsolidate: (orderIds: string[]) => void;
  onViewDetails: (order: Order) => void;
}

const StaffOrderProcessView: React.FC<StaffOrderProcessProps> = ({ orders, onConfirm, onConsolidate, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = orders.filter((o) => {
    const keyword = searchTerm.toLowerCase();
    const customerName = (o.customerName || '').toLowerCase();
    return o.id.toLowerCase().includes(keyword) || customerName.includes(keyword);
  });

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main">Xử lý đơn hàng</h1>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Lọc theo ID đơn / Tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-border-theme rounded-md py-1.5 pl-9 pr-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none w-64"
            />
            <Search className="absolute left-3 top-2 text-[#A0AEC0]" size={14} />
          </div>
          <button 
            disabled={selectedOrders.length < 2}
            onClick={() => onConsolidate(selectedOrders)}
            className={`btn-dense flex items-center gap-2 ${
              selectedOrders.length >= 2 
              ? 'bg-primary text-white hover:bg-opacity-90' 
              : 'bg-white border border-border-theme text-[#A0AEC0] cursor-not-allowed'
            }`}
          >
            <PlusCircle size={14} /> Gộp đơn {selectedOrders.length > 0 && `(${selectedOrders.length})`}
          </button>
        </div>
      </div>

      <div className="bg-white border border-border-theme rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#F7FAFC] border-b border-border-theme">
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider text-center">Chọn</th>
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider">Mã đơn hàng</th>
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider">Tên khách hàng</th>
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider">Số lượng (sản phẩm)</th>
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider">Tổng tiền (VNĐ)</th>
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider">Trạng thái thanh toán</th>
              <th className="px-4 py-3 font-bold text-[#718096] uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-theme">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#EDF2F7] transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="rounded border-[#CBD5E0] text-primary focus:ring-primary cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-text-main">
                    <span
                      title={`#${order.id}`}
                      className="inline-block max-w-[170px] truncate align-bottom"
                    >
                      #{order.id}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       <span className="font-semibold text-[#4A5568]">{order.customerName || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#718096]">
                    {order.itemCount ?? 0}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">{order.totalAmount.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="p-1.5 text-[#4A5568] hover:bg-gray-100 rounded transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                         onClick={() => onConfirm(order.id, true)}
                         className="p-1.5 text-primary hover:bg-primary-light rounded transition-all"
                         title="Phê duyệt"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button 
                        onClick={() => onConfirm(order.id, false)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Từ chối"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#718096] italic">Không có đơn hàng nào đang chờ xác nhận.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffOrderProcessView;
