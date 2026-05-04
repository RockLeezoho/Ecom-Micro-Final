import React, { useState } from 'react';
import { Truck, MapPin, AlertCircle, ChevronRight, Printer } from 'lucide-react';
import { Order } from '../../types';

interface StaffOrderSortProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onNavigateToLabel: (order: Order) => void;
  onNavigateToHandover: () => void;
}

const StaffOrderSortView: React.FC<StaffOrderSortProps> = ({ orders, onUpdateOrder, onNavigateToLabel, onNavigateToHandover }) => {
  const [filterRegion, setFilterRegion] = useState('all');

  const filteredOrders = orders.filter(o => 
    filterRegion === 'all' || o.region === filterRegion
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Logistics & Phân loại</h1>
          <p className="text-gray-500 font-medium">Quản lý các đơn vị vận chuyển và thứ tự ưu tiên</p>
        </div>
        <div className="flex space-x-4">
           <div className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
            <MapPin size={18} className="text-gray-400 mr-2" />
            <select 
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-gray-700 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Tất cả các miền</option>
              <option value="North">Miền Bắc</option>
              <option value="Central">Miền Trung</option>
              <option value="South">Miền Nam</option>
            </select>
          </div>
          <button 
            onClick={onNavigateToHandover}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center hover:bg-black transition-all"
          >
            Đi đến Bàn giao <ChevronRight size={18} className="ml-2" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 hover:border-accent transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Mã đơn hàng</span>
                <h3 className="text-xl font-black text-gray-900">#{order.id}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${order.priority === 'express' ? 'bg-red-50 text-red-600' : 'bg-primary-light text-primary'}`}>
                <AlertCircle size={24} />
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Vùng miền</span>
                <span className="font-black text-gray-700">
                    {order.region === 'North' ? 'Miền Bắc' : order.region === 'Central' ? 'Miền Trung' : order.region === 'South' ? 'Miền Nam' : 'Chưa thiết lập'}
                </span>
              </div>
              
              <div>
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block mb-2">Mức độ ưu tiên</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['standard', 'express'] as const).map(p => (
                    <button 
                      key={p}
                      onClick={() => onUpdateOrder(order.id, { priority: p })}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        order.priority === p ? 'border-primary bg-primary-light text-primary' : 'border-gray-50 bg-gray-50 text-gray-400'
                      }`}
                    >
                      {p === 'standard' ? 'Tiêu chuẩn' : 'Hỏa tốc'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block mb-2">Đơn vị vận chuyển</label>
                <select 
                  value={order.carrier || ''}
                  onChange={(e) => onUpdateOrder(order.id, { carrier: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary"
                >
                  <option value="">Chọn đơn vị vận chuyển</option>
                  <option value="FastTrack">FastTrack Logistics</option>
                  <option value="EcoShipper">EcoShipper</option>
                  <option value="AirGlobal">AirGlobal hỏa tốc</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={() => onNavigateToLabel(order)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
            >
              In nhãn vận chuyển <Printer size={16} className="ml-2" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffOrderSortView;
