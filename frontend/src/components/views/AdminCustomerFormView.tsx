import React, { useState } from 'react';
import { ChevronLeft, Save, User, Mail, Phone, Lock, Ruler, Weight, Footprints } from 'lucide-react';
import { t } from '../../utils/translate';
import { User as UserType } from '../../types';

interface AdminCustomerFormProps {
  customer?: UserType;
  onSave: (customer: Record<string, unknown>) => Promise<void> | void;
  onCancel: () => void;
}

const AdminCustomerFormView: React.FC<AdminCustomerFormProps> = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: customer?.username || '',
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phoneNumber: customer?.phoneNumber || '',
    height: customer?.height?.toString() || '',
    weight: customer?.weight?.toString() || '',
    footLength: customer?.footLength?.toString() || '',
    isActive: customer?.isActive ?? true,
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...(customer?.id ? { id: customer.id } : {}),
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        foot_length: formData.footLength ? Number(formData.footLength) : null,
        is_active: formData.isActive,
        ...(formData.password ? { password: formData.password } : {}),
      });
    } catch (err: any) {
      setError(err.message || t('cannot_save_customer'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <button onClick={onCancel} className="text-gray-400 font-bold text-sm flex items-center hover:text-primary transition-colors mb-4">
          <ChevronLeft size={16} className="mr-1" /> {t('back_to_customers')}
        </button>
        <h1 className="text-4xl font-black text-gray-900">{customer ? t('edit_customer') : t('create_new_customer')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-primary/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('username_label')}</label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="VD: customer001"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                required
              />
              <User className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('last_name_label')}</label>
            <div className="relative">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
              />
              <User className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('first_name_label')}</label>
            <div className="relative">
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
              />
              <User className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('email_label')}</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                required
              />
              <Mail className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('phone_label')}</label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                required
              />
              <Phone className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('height_label')}</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
              />
              <Ruler className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('weight_label')}</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
              />
              <Weight className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('foot_length_label')}</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.footLength}
                onChange={(e) => setFormData({ ...formData, footLength: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
              />
              <Footprints className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{customer ? t('new_password_label') : t('init_password_label')}</label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={customer ? t('pwd_leave_empty') : t('pwd_enter_password')}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                required={!customer}
              />
              <Lock className="absolute left-4 top-4 text-primary" size={20} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('account_status_label')}</label>
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
              <input
                id="customer-active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="customer-active" className="text-sm font-bold text-gray-700">
                {t('allow_customer_account')}
              </label>
            </div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

        <div className="flex space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
          >
            <Save size={20} className="mr-2" /> {saving ? t('saving') : customer ? 'Cập nhật khách hàng' : 'Hoàn tất đăng ký'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCustomerFormView;
