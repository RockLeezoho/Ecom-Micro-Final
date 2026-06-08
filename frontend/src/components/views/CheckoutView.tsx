import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Truck, CreditCard, ChevronLeft, ShieldCheck, Wallet, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { CartItem, User } from '../../types';
import { createShippingAddress, deleteShippingAddress, listShippingAddresses, type ShippingAddress } from '../../services/customerService';
import { listPaymentMethods, type PaymentMethod } from '../../services/paymentService';
import { listShippingCarriers, type CarrierOption } from '../../services/shippingService';
import { t } from '../../utils/translate';

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
  const [selectedCarrierCode, setSelectedCarrierCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsError, setMethodsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLElement | null>(null);
  const carriersContainerRef = useRef<HTMLDivElement | null>(null);
  const paymentsContainerRef = useRef<HTMLDivElement | null>(null);

  const canUseSavedAddresses = (currentUser?.role || '').toLowerCase() === 'customer';

  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedAddressId) || null, [addresses, selectedAddressId]);
  const selectedCarrier = useMemo(() => carriers.find((carrier) => carrier.code === selectedCarrierCode) || null, [carriers, selectedCarrierCode]);
  const selectedPaymentMethodCode = String(paymentMethod || '').toUpperCase();
  const isCodPayment = selectedPaymentMethodCode === 'COD';
  const paymentFlowHint = isCodPayment ? t('checkout_payment_cod_hint') : t('checkout_payment_bank_hint');
  const unavailableItems = useMemo(
    () => selectedItems.filter((item) => Number(item.stock || 0) <= 0 || Number(item.quantity) > Number(item.stock || 0)),
    [selectedItems]
  );

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
        setAddressesError(err.message || t('cannot_load_addresses'));
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
        const [carrierData, payment] = await Promise.all([listShippingCarriers(), listPaymentMethods()]);
        setCarriers(carrierData);
        setPaymentMethods(payment);
        if (carrierData.length > 0) {
          setSelectedCarrierCode((prev) => prev || carrierData[0].code);
        }
        if (payment.length > 0) {
          setPaymentMethod(payment[0].code);
        }
      } catch (err: any) {
        setMethodsError(err.message || t('cannot_load_methods'));
      }
    };
    loadMethods();
  }, []);

  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = selectedCarrier?.fee || 0;
  const total = subtotal + shippingFee;

  const isFormValid = useMemo(() => {
    const hasAddress = Boolean(selectedAddressId) || Boolean(addressText.trim());
    const hasCarrier = Boolean(selectedCarrierCode);
    const hasPayment = Boolean(paymentMethod);
    const hasItems = selectedItems.length > 0;
    return hasAddress && hasCarrier && hasPayment && hasItems;
  }, [selectedAddressId, addressText, selectedCarrierCode, paymentMethod, selectedItems]);

  const canCheckout = isFormValid && unavailableItems.length === 0;

  const handlePay = () => {
    if (unavailableItems.length > 0) {
      const firstUnavailable = unavailableItems[0];
      setFormError(
        `${firstUnavailable.name} ${t('out_of_stock')} (${t('checkout_stock_available') || 'Tồn kho'}: ${Number(firstUnavailable.stock || 0)}). ` +
        `${t('checkout_out_of_stock_error') || 'Vui lòng xóa hoặc cập nhật số lượng trước khi thanh toán.'}`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isFormValid) {
      setFormError(t('checkout_fill_required') || 'Vui lòng chọn địa chỉ, đơn vị vận chuyển và phương thức thanh toán.');
      // Focus & scroll to first invalid field
      if (selectedItems.length === 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!selectedAddressId && !addressText.trim()) {
        const el = addressInputRef.current as any;
        if (el) {
          try { el.focus(); } catch (e) {}
          try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        }
        return;
      }
      if (!selectedCarrierCode) {
        const btn = carriersContainerRef.current?.querySelector('button') as HTMLElement | null;
        if (btn) {
          try { btn.focus(); } catch (e) {}
          try { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        }
        return;
      }
      if (!paymentMethod) {
        const btn = paymentsContainerRef.current?.querySelector('button') as HTMLElement | null;
        if (btn) {
          try { btn.focus(); } catch (e) {}
          try { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        }
        return;
      }
    }
    setFormError(null);
    onCompletePayment({
      address: selectedAddress?.address || addressText,
      addressId: selectedAddress?.id || '',
      addressText: selectedAddress?.address || addressText,
      carrierCode: selectedCarrier?.code || '',
      carrierName: selectedCarrier?.name || '',
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
      setAddressesError(err.message || t('cannot_add_address'));
    }
  };

  const removeAddress = async (id: string) => {
    if (!window.confirm(t('checkout_confirm_delete_address'))) return;
    setAddressesError(null);
    try {
      await deleteShippingAddress(id);
      setAddresses((prev) => prev.filter((item) => item.id !== id));
      if (selectedAddressId === id) {
        const remaining = addresses.filter((item) => item.id !== id);
        setSelectedAddressId(remaining[0]?.id || '');
      }
    } catch (err: any) {
      setAddressesError(err.message || t('checkout_delete_address_error'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <button 
          onClick={() => onNavigate({ type: 'CART' })}
          className="text-[#718096] font-bold text-xs flex items-center hover:text-primary transition-colors gap-1 mb-2"
        >
          <ChevronLeft size={14} /> {t('back_to_cart')}
        </button>
          <h1 className="text-xl font-bold text-text-main">{t('checkout_title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-8">
          {/* Address */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary-light text-primary rounded border border-primary/10">
                <MapPin size={14} />
              </div>
              <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">{t('checkout_address_label')}</h2>
            </div>
            <div className="bg-white border border-border-theme rounded-lg p-4 shadow-sm">
              {addressesError && (
                <div className="mb-3 text-xs font-bold text-red-500">{addressesError}</div>
              )}

              {canUseSavedAddresses ? (
                <div className="space-y-4">
                  {/* Add New Address Form */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAddress()}
                        className="flex-1 bg-[#F7FAFC] border border-border-theme rounded-md p-3 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                        placeholder={t('checkout_add_new_address')}
                      />
                      <button
                        type="button"
                        onClick={addAddress}
                        disabled={!newAddress.trim()}
                        className="px-4 rounded-md bg-primary hover:bg-opacity-90 disabled:bg-opacity-50 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                      >
                        <Plus size={14} /> {t('checkout_add_button')}
                      </button>
                    </div>
                  </div>

                  {addressesLoading ? (
                    <div className="text-xs text-gray-400 font-medium text-center py-4">{t('checkout_loading_addresses')}</div>
                  ) : addresses.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                        {t('checkout_saved_addresses')} ({addresses.length})
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all group ${
                              selectedAddressId === addr.id
                                ? 'border-primary bg-primary-light shadow-md'
                                : 'border-border-theme bg-white hover:border-primary/50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors">
                                  {addr.address}
                                </p>
                              </div>
                              {selectedAddressId === addr.id && (
                                <div className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                                  ✓
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Delete Address Button */}
                      {selectedAddress && (
                        <button
                          type="button"
                          onClick={() => removeAddress(selectedAddress.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 inline-flex items-center gap-1 transition-colors pt-2"
                        >
                          <Trash2 size={14} /> {t('checkout_delete_address')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-xs font-semibold mb-2">{t('checkout_no_saved_addresses') || 'Chưa có địa chỉ đã lưu'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{t('checkout_input_address_above') || 'Vui lòng thêm địa chỉ mới ở trên'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  ref={addressInputRef as any}
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md p-3 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none resize-none h-20"
                  placeholder={t('checkout_input_address')}
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
              <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">Chọn đơn vị vận chuyển</h2>
            </div>
            <div ref={carriersContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {carriers.map((carrier) => (
                <button
                  key={carrier.code}
                  onClick={() => setSelectedCarrierCode(carrier.code)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedCarrierCode === carrier.code ? 'border-primary bg-primary-light shadow-sm' : 'border-border-theme bg-white hover:border-primary'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-text-main text-xs uppercase">{carrier.name}</span>
                    <span className="text-primary font-bold text-xs">{carrier.fee.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-widest">{carrier.code}</div>
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
              <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">{t('checkout_payment_label')}</h2>
            </div>
            <div className="mb-3 rounded-lg border border-border-theme bg-[#F7FAFC] px-3 py-2 text-[10px] font-semibold leading-relaxed text-[#4A5568]">
              {paymentFlowHint}
            </div>
            {methodsError && <div className="mb-2 text-xs font-bold text-red-500">{methodsError}</div>}
            <div ref={paymentsContainerRef} className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                (() => {
                  const methodCode = String(method.code || '').toUpperCase();
                  const methodHint = methodCode === 'COD'
                    ? t('checkout_payment_cod_option_hint')
                    : methodCode === 'BANK_TRANSFER'
                      ? t('checkout_payment_bank_option_hint')
                      : method.name;

                  return (
                <button 
                  key={method.code}
                  onClick={() => setPaymentMethod(method.code)}
                  title={methodHint}
                  className={`p-3 border rounded-lg flex items-start gap-3 transition-all text-left ${
                    paymentMethod === method.code ? 'border-primary bg-primary-light shadow-sm' : 'border-border-theme bg-white hover:border-primary'
                  }`}
                >
                  <Wallet size={16} className={paymentMethod === method.code ? 'text-primary' : 'text-[#CBD5E0]'} />
                  <div className="min-w-0 flex-1">
                    <span className={`block text-[11px] font-bold uppercase tracking-widest leading-tight ${paymentMethod === method.code ? 'text-primary' : 'text-[#718096]'}`}>
                      {method.name}
                    </span>
                    <span className={`mt-1 block text-[9px] font-medium leading-snug ${paymentMethod === method.code ? 'text-primary/80' : 'text-[#A0AEC0]'}`}>
                      {methodHint}
                    </span>
                  </div>
                </button>
                  );
                })()
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#1A202C] text-white rounded-lg p-6 shadow-lg sticky top-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-3">{t('checkout_summary_label')}</h2>
            
            <div className="flex flex-col gap-3 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {unavailableItems.length > 0 && (
                <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600">
                  {t('checkout_out_of_stock_banner') || 'Có sản phẩm hết hàng hoặc vượt quá tồn kho. Vui lòng cập nhật giỏ hàng.'}
                </div>
              )}
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-white/5 overflow-hidden shrink-0 border border-white/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate leading-tight uppercase font-mono">{item.name}</p>
                      <p className="text-[9px] text-[#A0AEC0] font-bold">{t('checkout_item_quantity', { count: item.quantity })}</p>
                      {Number(item.stock || 0) <= 0 ? (
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400">{t('out_of_stock')}</p>
                      ) : Number(item.quantity) > Number(item.stock || 0) ? (
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                          {t('checkout_only_available') || `Chỉ còn ${Number(item.stock || 0)} sản phẩm`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="font-bold text-[11px] tracking-tight shrink-0 font-mono">{(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                </div>
              ))}
            </div>
            
            {/* Shipping Address Summary */}
            <div className="mb-6 pt-4 border-t border-white/10">
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 flex items-center justify-between gap-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/70 flex-shrink-0">
                    {t('checkout_address_label')}
                  </span>
                  <p className="text-[11px] font-bold text-white/90 leading-relaxed text-right break-words">
                    {selectedAddress?.address || addressText || t('checkout_no_address')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6 pt-4 border-t border-white/10">
              <div className="flex justify-between text-[#A0AEC0] font-bold text-[10px] uppercase">
                <span>{t('checkout_subtotal')}</span>
                <span>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-[#A0AEC0] font-bold text-[10px] uppercase">
                <span>{t('checkout_shipping_fee')}</span>
                <span>{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="pt-3 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest">{t('checkout_total')}</span>
                <span className="text-2xl font-black text-primary font-mono">{total.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            {formError && (
              <div className="mb-3 text-xs font-bold text-red-500">{formError}</div>
            )}
            <button
              onClick={handlePay}
              disabled={!canCheckout}
              className={`w-full py-3 rounded font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group ${canCheckout ? 'bg-primary hover:bg-opacity-90 text-white' : 'bg-primary opacity-50 cursor-not-allowed text-white/70'}`}
            >
              {isCodPayment ? t('checkout_place_order_button') : t('checkout_order_button')}{' '}
              <ChevronRight size={14} className={`transition-transform ${canCheckout ? 'group-hover:translate-x-0.5' : ''}`} />
            </button>
            
            <div className="mt-6 flex items-center justify-center text-white/30 gap-2">
              <ShieldCheck size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">{t('checkout_ssl_info')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
