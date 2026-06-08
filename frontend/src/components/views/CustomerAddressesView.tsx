import React, { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import type { User } from '../../types';
import { createShippingAddress, deleteShippingAddress, listShippingAddresses, type ShippingAddress } from '../../services/customerService';
import { t } from '../../utils/translate';

interface CustomerAddressesViewProps {
  currentUser: User | null;
}

const CustomerAddressesView: React.FC<CustomerAddressesViewProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [newAddress, setNewAddress] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listShippingAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || t('addresses_cannot_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((currentUser?.role || '').toLowerCase() === 'customer') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const add = async () => {
    if (!newAddress.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createShippingAddress(newAddress.trim());
      setAddresses((prev) => [created, ...prev]);
      setNewAddress('');
    } catch (err: any) {
      setError(err.message || t('addresses_cannot_add'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('addresses_confirm_delete'))) return;
    setError(null);
    try {
      await deleteShippingAddress(id);
      setAddresses((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || t('addresses_cannot_delete'));
    }
  };

  if (!currentUser || (currentUser.role || '').toLowerCase() !== 'customer') {
    return <div className="p-8 text-center text-gray-400">{t('please_login_customer')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('addresses_title')}</h1>
          <p className="text-gray-500 font-medium">{t('addresses_description')}</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
          <MapPin size={22} />
        </div>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 mb-6">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('addresses_add_section')}</div>
        <div className="flex gap-3">
          <input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder={t('addresses_placeholder')}
            className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            disabled={saving}
            onClick={add}
            className="bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={16} className="mr-2" /> {saving ? t('addresses_saving') : t('addresses_add_button')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">{t('addresses_loading')}</div>
      ) : (
        <div className="space-y-4">
          {addresses.map((item) => (
            <div key={item.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex items-start justify-between gap-4 group cursor-pointer">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary-light group-hover:text-primary group-hover:border-primary transition-all">
                  <MapPin size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 group-hover:text-primary transition-colors text-sm line-clamp-2">{item.address}</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">{t('click_to_select_checkout') || 'Chọn để dùng khi thanh toán'}</p>
                </div>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="py-16 text-center">
              <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 font-medium">{t('addresses_empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerAddressesView;
