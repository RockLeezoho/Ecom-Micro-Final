import React, { useState } from 'react';
import { Truck, MapPin, AlertCircle, ChevronRight, Printer, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';

interface StaffOrderSortProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onNavigateToLabel: (order: Order) => void;
  onNavigateToHandover: () => void;
}

const StaffOrderSortView: React.FC<StaffOrderSortProps> = ({ orders, onUpdateOrder, onNavigateToLabel, onNavigateToHandover }) => {
  const [editingRegion, setEditingRegion] = useState<string | null>(null);

  const getRegionLabel = (region?: string) => {
    if (region === 'North') return 'Miền Bắc';
    if (region === 'Central') return 'Miền Trung';
    if (region === 'South') return 'Miền Nam';
    return 'Chưa thiết lập';
  };

  const getPriorityBadgeClass = (priority?: string) => {
    if (priority === 'express') {
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    return 'bg-sky-50 text-sky-700 border border-sky-200';
  };

  const getStatusIcon = (carrier?: string) => {
    if (carrier) {
      return <CheckCircle size={18} className="text-emerald-600" />;
    }
    return <AlertTriangle size={18} className="text-amber-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary mb-3">Logistics workspace</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Tạo mã vận đơn</h1>
          <p className="text-gray-500 font-medium mt-3 max-w-2xl">
            Thiết lập miền giao hàng, chọn mức ưu tiên và đơn vị vận chuyển cho từng đơn hàng.
          </p>
        </div>

        <button
          onClick={onNavigateToHandover}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-gray-900/10"
        >
          Đi đến Bàn giao <ChevronRight size={18} className="ml-2" />
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[32px] shadow-xl shadow-primary/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900">Danh sách đơn hàng cần xử lý</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">{orders.length} đơn hàng</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Miền</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Ưu tiên</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Đơn vị VC</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900 text-sm truncate max-w-[100px]">
                        #{order.id.slice(0, 10)}...
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {editingRegion === order.id ? (
                        <select
                          autoFocus
                          value={order.region || ''}
                          onChange={(e) => {
                            onUpdateOrder(order.id, { region: e.target.value });
                            setEditingRegion(null);
                          }}
                          onBlur={() => setEditingRegion(null)}
                          className="w-full bg-white border border-primary rounded-lg py-1.5 px-2 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Chọn miền</option>
                          <option value="North">Miền Bắc</option>
                          <option value="Central">Miền Trung</option>
                          <option value="South">Miền Nam</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRegion(order.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-all whitespace-nowrap"
                        >
                          <MapPin size={14} />
                          {getRegionLabel(order.region)}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {(['standard', 'express'] as const).map((priority) => (
                          <button
                            key={priority}
                            onClick={() => onUpdateOrder(order.id, { priority })}
                            className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                              order.priority === priority
                                ? priority === 'express'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                  : 'bg-sky-100 text-sky-700 border border-sky-300'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {priority === 'standard' ? 'Tiêu' : 'Hỏa'}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={order.carrier || ''}
                        onChange={(e) => onUpdateOrder(order.id, { carrier: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">Chọn VC</option>
                        <option value="FastTrack">FastTrack</option>
                        <option value="EcoShipper">EcoShipper</option>
                        <option value="AirGlobal">AirGlobal</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        {getStatusIcon(order.carrier)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => onNavigateToLabel(order)}
                        disabled={!order.region || !order.carrier}
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${
                          !order.region || !order.carrier
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                        }`}
                        title={!order.region || !order.carrier ? 'Thiết lập miền và đơn vị VC trước khi in nhãn' : 'In mã vận đơn'}
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-300">
                        <Truck size={24} />
                      </div>
                      <h3 className="text-sm font-black text-gray-900">Không có đơn hàng</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Chờ thêm đơn hàng vào hàng đợi.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffOrderSortView;
