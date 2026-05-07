import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Package, MapPin, Truck, CreditCard, Star, MessageSquare } from 'lucide-react';
import { Order } from '../../types';
import { t } from '../../utils/translate';

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
  onReview: (productId: string) => void;
}

const OrderDetailsView: React.FC<OrderDetailsProps> = ({ order, onBack, onReview }) => {
  const steps: Order['status'][] = ['awaiting_confirmation', 'awaiting_pickup', 'awaiting_delivery', 'delivered'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <div>
            <button 
                onClick={onBack}
                className="text-gray-400 font-bold text-sm flex items-center hover:text-primary transition-colors mb-4"
            >
                <ChevronLeft size={16} className="mr-1" /> {t('back_to_orders')}
            </button>
            <h1 className="text-4xl font-black text-gray-900">Chi tiết đơn hàng</h1>
            <p className="text-primary font-black uppercase text-xs tracking-widest mt-1">{t('order_details_status_label')} {order.status === 'delivered' ? t('order_details_status_delivered') : t('order_details_status_processing')}</p>
        </div>
        <div className="text-right">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('order_details_payment_label')}</div>
            <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {order.paymentStatus === 'paid' ? t('order_details_payment_paid') : t('order_details_payment_unpaid')}
                        <h1 className="text-4xl font-black text-gray-900">{t('order_details_title')}</h1>
            </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-primary/5 mb-12">
         <div className="relative flex justify-between">
            {/* Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
               className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0"
            ></motion.div>

            {steps.map((step, index) => (
                <div key={step} className="relative z-10 flex flex-col items-center group">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border-4 ${
                        index <= currentStepIndex ? 'bg-primary text-white border-primary-light' : 'bg-white text-gray-300 border-gray-50'
                    }`}>
                        {index < currentStepIndex ? <Package size={20} /> : <div className="h-2 w-2 rounded-full bg-current"></div>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter mt-3 text-center w-24 ${
                        index <= currentStepIndex ? 'text-primary font-black' : 'text-gray-300'
                    }`}>
                            {step === 'awaiting_confirmation' ? t('order_status_awaiting_confirmation') : 
                            step === 'awaiting_pickup' ? t('order_status_awaiting_pickup') :
                            step === 'awaiting_delivery' ? t('order_status_awaiting_delivery') : t('order_status_delivered')}
                    </span>
                </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
            {/* Items */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-primary/5">
                <h3 className="text-xl font-black text-gray-900 mb-6 underline decoration-accent decoration-4 underline-offset-4">{t('order_details_items_title')}</h3>
                <div className="divide-y divide-gray-50">
                    {order.items.map(item => (
                        <div key={item.id} className="py-6 flex justify-between items-center group">
                            <div className="flex space-x-6">
                                <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-base font-black text-gray-900 truncate mb-1">{item.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.subCategory} • {t('order_details_quantity_label')} {item.quantity}</p>
                                    {order.status === 'delivered' && (
                                        <button 
                                            onClick={() => onReview(item.id)}
                                            className="mt-3 text-xs font-black text-primary flex items-center hover:bg-primary-light w-fit px-3 py-1.5 rounded-lg transition-colors border border-primary-light"
                                        >
                                            <MessageSquare size={14} className="mr-1.5" /> {t('order_details_review_button')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <span className="font-black text-gray-900">{(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
             {/* Shipping Info */}
             <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100">
                <div className="flex items-center mb-6 text-blue-600">
                    <MapPin size={20} className="mr-2" />
                    <h3 className="text-sm font-black uppercase tracking-widest">{t('order_details_shipping_address')}</h3>
                </div>
                <p className="text-sm font-bold text-gray-700 leading-relaxed mb-8">{order.address}</p>

                <div className="flex items-center mb-6 text-blue-600">
                    <Truck size={20} className="mr-2" />
                    <h3 className="text-sm font-black uppercase tracking-widest">{t('order_details_shipping_method')}</h3>
                                <p className="text-sm font-bold text-gray-700 capitalize mb-8">{order.shippingMethod === 'standard' ? t('order_details_shipping_standard') : t('order_details_shipping_express')}</p>
                </div>
                <p className="text-sm font-bold text-gray-700 capitalize mb-8">{order.shippingMethod === 'standard' ? 'Giao hàng tiêu chuẩn' : 'Giao hàng hỏa tốc'}</p>

                <div className="flex items-center mb-6 text-blue-600">
                    <CreditCard size={20} className="mr-2" />
                    <h3 className="text-sm font-black uppercase tracking-widest">{t('order_details_payment_method')}</h3>
                </div>
                <p className="text-sm font-bold text-gray-700 mb-4">{order.paymentMethod}</p>
             </div>

             {/* Order value */}
             <div className="bg-primary text-white rounded-[40px] p-8 shadow-xl shadow-primary/20">
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-accent font-bold text-xs uppercase tracking-widest">
                        <span>{t('order_details_total_items')}</span>
                        <span>{order.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between text-blue-200 font-bold text-xs uppercase tracking-widest">
                        <span>{t('order_details_shipping_fee')}</span>
                        <span>{order.shippingFee.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="pt-4 border-t border-blue-500 flex justify-between items-center">
                        <span className="text-lg font-black">{t('order_details_total_payment')}</span>
                        <span className="text-3xl font-black text-white">{(order.totalAmount + order.shippingFee).toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsView;
