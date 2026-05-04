import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Truck, CreditCard, ChevronLeft, ShieldCheck, Wallet, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { CartItem, User } from '../../types';
import { createShippingAddress, deleteShippingAddress, listShippingAddresses, type ShippingAddress } from '../../services/customerService';
import { listPaymentMethods, type PaymentMethod } from '../../services/paymentService';
import { listShippingMethods, type ShippingMethod } from '../../services/shippingService';

interface CheckoutViewProps {
  selectedItems: CartItem[];
  onCompletePayment: (orderDetails: any) => void;
  onNavigate: (view: any) => void;
  currentUser?: User | null;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({ selectedItems, onCompletePayment, onNavigate, currentUser }) => {
  const [addressText, setAddressText] = useState('');
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [newAddress, setNewAddress] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  const canUseSavedAddresses = currentUser?.role === 'customer';

  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedAddressId) || null, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!canUseSavedAddresses) return;
    const load = async () => {
      setAddressesLoading(true);
      setAddressesError(null);
      try {
        const data = await listShippingAddresses();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId((prev) => prev || data[0].id);
        }
      } catch (err: any) {
        setAddressesError(err.message || 'Không thể tải địa chỉ');
      } finally {
        setAddressesLoading(false);
      }
    };
    load();
  }, [canUseSavedAddresses]);

  useEffect(() => {
    const loadMethods = async () => {
      setMethodsError(null);
      try {
        const [shipping, payment] = await Promise.all([listShippingMethods(), listPaymentMethods()]);
        setShippingMethods(shipping);
        setPaymentMethods(payment);
        if (shipping.length > 0) {
          setShippingMethod(shipping[0].code);
        }
        if (payment.length > 0) {
          setPaymentMethod(payment[0].code);
        }
      } catch (err: any) {
        setMethodsError(err.message || 'Không thể tải phương thức thanh toán hoặc vận chuyển');
      }
    };
    loadMethods();
  }, []);

  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const selectedShipping = shippingMethods.find((method) => method.code === shippingMethod);
  const shippingFee = selectedShipping?.fee || 0;
  const total = subtotal + shippingFee;

  const handlePay = () => {
    onCompletePayment({
      address: selectedAddress?.address || addressText,
      addressId: selectedAddress?.id || '',
      shippingMethod,
      paymentMethod,
      subtotal,
      shippingFee,
      total
    });
  };

  const addAddress = async () => {
    if (!newAddress.trim()) return;
    setAddressesError(null);
    try {
      const created = await createShippingAddress(newAddress.trim());
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setNewAddress('');
    } catch (err: any) {
      setAddressesError(err.message || 'Không thể thêm địa chỉ');
    }
  };

  const removeAddress = async (id: string) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    setAddressesError(null);
    try {
      await deleteShippingAddress(id);
      setAddresses((prev) => prev.filter((item) => item.id !== id));
      if (selectedAddressId === id) {
        const remaining = addresses.filter((item) => item.id !== id);
        setSelectedAddressId(remaining[0]?.id || '');
      }
    } catch (err: any) {
      setAddressesError(err.message || 'Không thể xóa địa chỉ');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <button 
          onClick={() => onNavigate({ type: 'CART' })}
          className="text-[#718096] font-bold text-xs flex items-center hover:text-primary transition-colors gap-1 mb-2"
        >
          <ChevronLeft size={14} /> Quay lại Giỏ hàng
        </button>
        <h1 className="text-xl font-bold text-text-main">Thanh toán giao dịch</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-8">
          {/* Address */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary-light text-primary rounded border border-primary/10">
                <MapPin size={14} />
              </div>
              <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">Địa điểm giao hàng</h2>
            </div>
            <div className="bg-white border border-border-theme rounded-lg p-4 shadow-sm">
              {addressesError && (
                <div className="mb-3 text-xs font-bold text-red-500">{addressesError}</div>
              )}

              {canUseSavedAddresses ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="flex-1 bg-[#F7FAFC] border border-border-theme rounded-md p-3 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Thêm địa chỉ mới..."
                    />
                    <button
                      type="button"
                      onClick={addAddress}
                      className="px-3 rounded-md bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                    >
                      <Plus size={14} /> Thêm
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="text-xs text-gray-400 font-medium">Đang tải địa chỉ...</div>
                  ) : addresses.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full bg-[#F7FAFC] border border-border-theme rounded-md p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                      >
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.address}
                          </option>
                        ))}
                      </select>
                      {selectedAddress && (
                        <button
                          type="button"
                          onClick={() => removeAddress(selectedAddress.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Xóa địa chỉ đang chọn
                        </button>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                      className="w-full bg-[#F7FAFC] border border-border-theme rounded-md p-3 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none resize-none h-20"
                      placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                    />
                  )}
                </div>
              ) : (
                <textarea
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md p-3 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none resize-none h-20"
                  placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                />
              )}
            </div>
          </section>

          {/* Shipping */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary-light text-primary rounded border border-primary/10">
                <Truck size={14} />
              </div>
              <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">Phương thức vận chuyển</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shippingMethods.map((method) => (
                <button
                  key={method.code}
                  onClick={() => setShippingMethod(method.code)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    shippingMethod === method.code ? 'border-primary bg-primary-light shadow-sm' : 'border-border-theme bg-white hover:border-primary'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-text-main text-xs uppercase">{method.name}</span>
                    <span className="text-primary font-bold text-xs">{method.fee.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary-light text-primary rounded border border-primary/10">
                <CreditCard size={14} />
              </div>
              <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">Phương thức thanh toán</h2>
            </div>
            {methodsError && <div className="mb-2 text-xs font-bold text-red-500">{methodsError}</div>}
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button 
                  key={method.code}
                  onClick={() => setPaymentMethod(method.code)}
                  className={`p-3 border rounded-lg flex items-center gap-3 transition-all ${
                    paymentMethod === method.code ? 'border-primary bg-primary-light shadow-sm' : 'border-border-theme bg-white hover:border-primary'
                  }`}
                >
                  <Wallet size={16} className={paymentMethod === method.code ? 'text-primary' : 'text-[#CBD5E0]'} />
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${paymentMethod === method.code ? 'text-primary' : 'text-[#718096]'}`}>
                    {method.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#1A202C] text-white rounded-lg p-6 shadow-lg sticky top-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-3">Tóm tắt đơn hàng</h2>
            
            <div className="flex flex-col gap-3 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-white/5 overflow-hidden shrink-0 border border-white/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate leading-tight uppercase font-mono">{item.name}</p>
                      <p className="text-[9px] text-[#A0AEC0] font-bold">SỐ LƯỢNG: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[11px] tracking-tight shrink-0 font-mono">{(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 mb-6 pt-4 border-t border-white/10">
              <div className="flex justify-between text-[#A0AEC0] font-bold text-[10px] uppercase">
                <span>Tổng tiền hàng</span>
                <span>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-[#A0AEC0] font-bold text-[10px] uppercase">
                <span>Phí vận chuyển</span>
                <span>{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="pt-3 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest">Tổng cộng</span>
                <span className="text-2xl font-black text-primary font-mono">{total.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <button 
              onClick={handlePay}
              className="w-full bg-primary hover:bg-opacity-90 text-white py-3 rounded font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
            >
              Hoàn tất thanh toán <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            
            <div className="mt-6 flex items-center justify-center text-white/30 gap-2">
              <ShieldCheck size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Mã hóa AES-256 TLS đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
