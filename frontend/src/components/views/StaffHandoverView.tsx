import React, { useState } from 'react';
import { ArrowLeft, Download, Printer, User, Calendar, Hash, CheckSquare } from 'lucide-react';
import { Order } from '../../types';

interface StaffHandoverProps {
  orders: Order[];
  onBack: () => void;
  onHandover: (orderId: string, carrierName: string) => Promise<void>;
}

const StaffHandoverView: React.FC<StaffHandoverProps> = ({ orders, onBack, onHandover }) => {
  const [handoverPerson, setHandoverPerson] = useState('Sarah Williams');
  const readyOrders = orders.filter(o => o.carrier && o.status !== 'delivered');

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <button 
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-primary transition-colors text-sm font-bold"
        >
            <ArrowLeft size={16} className="mr-1" /> Quay lại Logistics
        </button>
        <div className="flex space-x-3">
             <button className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-gray-200 transition-all">
                <Download size={16} className="mr-2" /> Xuất PDF
            </button>
            <button className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                <Printer size={16} className="mr-2" /> In biên bản bàn giao
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-10">
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
            <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2">Biên bản bàn giao</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Biên bản chuyển giao chính thức cho nhà vận chuyển</p>
            </div>
            <div className="text-right">
                <img src="/logo_becshop.png" alt="BECShop Logo" className="h-16 w-16 mb-2 inline-block" />
                <div className="text-primary font-black text-xl">BECShop LLC Việt Nam</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-gray-50 rounded-3xl p-6">
                <div className="flex items-center mb-4 text-gray-900 font-black text-sm uppercase tracking-widest">
                    <User size={18} className="mr-2 text-primary" /> Người bàn giao
                </div>
                <input 
                    type="text"
                    value={handoverPerson}
                    onChange={(e) => setHandoverPerson(e.target.value)}
                    className="w-full bg-white border-none rounded-2xl py-4 px-6 text-xl font-black text-gray-900 focus:ring-2 focus:ring-primary shadow-sm"
                />
            </div>
            <div className="bg-gray-50 rounded-3xl p-6">
                <div className="flex items-center mb-4 text-gray-900 font-black text-sm uppercase tracking-widest">
                    <Calendar size={18} className="mr-2 text-primary" /> Ngày & Giờ
                </div>
                <div className="py-4 px-6 text-xl font-black text-gray-900">
                    {new Date().toLocaleDateString('vi-VN')} - {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                <Hash className="mr-2 text-primary" size={24} /> Danh sách bàn giao
            </h3>
            <div className="space-y-4">
                {readyOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-white rounded-xl mr-4 shadow-sm">
                                <CheckSquare size={20} className="text-green-500" />
                            </div>
                            <div>
                                <div className="text-xs font-black text-primary uppercase tracking-widest">Mã đơn hàng</div>
                                <div className="text-lg font-black text-gray-900">#{order.id}</div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Đơn vị vận chuyển</div>
                             <div className="text-sm font-black text-gray-700">{order.carrier}</div>
                             <button
                                onClick={() => onHandover(order.id, order.carrier || "")}
                                className="mt-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-primary text-white"
                             >
                                Xác nhận bàn giao
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mt-16 pt-12 border-t-2 border-dashed border-gray-100">
            <div className="text-center">
                <div className="w-full border-b-2 border-gray-900 h-24 mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Chữ ký xác nhận (BECShop)</p>
            </div>
            <div className="text-center">
                <div className="w-full border-b-2 border-gray-900 h-24 mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Chữ ký xác nhận (Nhà vận chuyển)</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StaffHandoverView;
