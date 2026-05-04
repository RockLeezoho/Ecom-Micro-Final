import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Printer, FileText, Download, Scale, Truck, User } from 'lucide-react';
import { Order } from '../../types';

interface StaffLabelPrintProps {
  order: Order;
  onBack: () => void;
}

const StaffLabelPrintView: React.FC<StaffLabelPrintProps> = ({ order, onBack }) => {
  const [weight, setWeight] = useState(order.weight || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-primary mb-8 transition-colors text-sm font-bold"
      >
        <ArrowLeft size={16} className="mr-1" /> Quay lại Phân loại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Label Preview */}
        <div className="bg-white border-4 border-black p-8 rounded-none flex flex-col items-center">
          <div className="w-full flex justify-between border-b-2 border-black pb-4 mb-4">
             <div className="text-2xl font-black">BECShop</div>
             <div className="text-xs font-black text-right">
                ƯU TIÊN: <span className="uppercase">{order.priority === 'express' ? 'HỎA TỐC' : 'TIÊU CHUẨN'}</span><br/>
                VẬN CHUYỂN: {order.carrier || 'N/A'}
             </div>
          </div>
          
          <div className="w-full mb-8">
            <div className="text-[10px] font-black uppercase mb-1">Giao đến:</div>
            <div className="border-2 border-black p-4 font-bold text-sm">
                KHÁCH HÀNG: {order.customerId}<br/>
                {order.address}
            </div>
          </div>

          <div className="w-full flex justify-between mb-8">
            <div className="border-2 border-black px-4 py-2 text-center flex-1 mr-2">
                <div className="text-[10px] font-black uppercase">Khối lượng</div>
                <div className="text-xl font-black">{weight} KG</div>
            </div>
            <div className="border-2 border-black px-4 py-2 text-center flex-1 ml-2">
                <div className="text-[10px] font-black uppercase">Mã đơn hàng</div>
                <div className="text-xl font-black">#{order.id.slice(-5)}</div>
            </div>
          </div>

          <div className="w-full h-24 bg-black flex items-center justify-center p-4">
            <div className="h-full w-full bg-white flex space-x-1 items-end py-2 px-4 justify-center">
                {[...Array(30)].map((_, i) => (
                    <div key={i} className="bg-black" style={{ width: Math.random() > 0.5 ? '2px' : '4px', height: '100%' }}></div>
                ))}
            </div>
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-tight">{order.id}</div>
        </div>

        {/* Controls */}
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-black text-gray-900 mb-2">In nhãn vận chuyển</h2>
          <p className="text-gray-500 font-medium mb-10">Kiểm tra kích thước và xác nhận khối lượng trước khi in.</p>
          
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 mb-8">
             <div className="mb-6">
                <label className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block mb-3">Khối lượng bưu kiện (KG)</label>
                <div className="relative">
                    <input 
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-xl font-black focus:ring-2 focus:ring-primary"
                    />
                    <Scale className="absolute left-4 top-4.5 text-primary" size={24} />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <button className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-gray-200 transition-all">
                    <Download size={18} className="mr-2" /> Xuất PDF
                </button>
                <button className="bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                    <Printer size={18} className="mr-2" /> In nhãn
                </button>
             </div>
          </div>

          <div className="flex items-center p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-yellow-800">
             <Truck size={20} className="mr-3 shrink-0" />
             <p className="text-xs font-bold leading-tight">Kiểm tra cẩn thận định dạng địa chỉ. Các chuyến hàng quốc tế có thể yêu cầu thêm tài liệu hải quan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLabelPrintView;
