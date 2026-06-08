import React from 'react';
import { motion } from 'motion/react';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, Search } from 'lucide-react';
import { Order } from '../../types';
import { t } from '../../utils/translate';

interface OrderHistoryProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onNavigate: (view: any) => void;
}

const OrderHistoryView: React.FC<OrderHistoryProps> = ({ orders, onViewDetails, onNavigate }) => {
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'awaiting_confirmation': return <Clock size={16} />;
      case 'awaiting_pickup': return <Package size={16} />;
      case 'awaiting_delivery': return <Truck size={16} />;
      case 'delivered': return <CheckCircle2 size={16} />;
      case 'canceled': return <XCircle size={16} />;
    }
  };

  const getStatusStyles = (status: Order['status']) => {
    switch (status) {
      case 'awaiting_confirmation': return 'bg-yellow-100 text-yellow-700';
      case 'awaiting_pickup': return 'bg-primary-light text-primary';
      case 'awaiting_delivery': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'canceled': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'awaiting_confirmation': return t('order_status_awaiting_confirmation');
      case 'awaiting_pickup': return t('order_status_awaiting_pickup');
      case 'awaiting_delivery': return t('order_status_awaiting_delivery');
      case 'delivered': return t('order_status_delivered');
      case 'canceled': return t('order_status_canceled');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('order_history_title')}</h1>
          <p className="text-gray-500 font-medium italic">{t('order_history_description')}</p>
        </div>
        <div className="p-3 bg-primary-light text-primary rounded-2xl">
           <Package size={28} />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[40px] p-12 text-center border border-gray-100 shadow-xl shadow-primary/5">
           <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6">
                <Search size={48} className="text-gray-200" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">{t('order_history_empty')}</h3>
           <p className="text-gray-500 mb-8 max-w-xs mx-auto">{t('order_history_empty_desc')}</p>
           <button 
                onClick={() => onNavigate({ type: 'HOME' })}
                className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20"
           >
                {t('order_history_to_shop')}
           </button>

        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onViewDetails(order)}
              className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 hover:shadow-primary/10 hover:border-accent transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-6">
                    <div className="h-16 w-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                        <img src={order.items[0]?.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Đơn hàng #{order.id}</h3>
                        <p className="text-sm font-bold text-primary">{order.totalAmount.toLocaleString('vi-VN')} {t('vnd_text')} {t('order_history_separator', { count: order.items.length })}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                    <div className={`flex items-center px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                        <span className="mr-2">{getStatusIcon(order.status)}</span>
                        {getStatusLabel(order.status)}
                    </div>
                    <div className="p-3 rounded-full group-hover:bg-primary-light group-hover:text-primary transition-colors">
                        <ChevronRight size={24} className="text-gray-300" />
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryView;
