import React, { useState } from 'react';
import { ChevronLeft, Save, User, Mail, Briefcase, Phone, Lock } from 'lucide-react';
import { t } from '../../utils/translate';
import { User as UserType } from '../../types';

interface AdminStaffFormProps {
  staff?: UserType;
  onSave: (staff: Record<string, unknown>) => Promise<void> | void;
  onCancel: () => void;
}

const AdminStaffFormView: React.FC<AdminStaffFormProps> = ({ staff, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: staff?.username || '',
    firstName: staff?.firstName || '',
    lastName: staff?.lastName || '',
    email: staff?.email || '',
    phoneNumber: staff?.phoneNumber || '',
    employmentType: staff?.employmentType || 'Full-time',
    isActive: staff?.isActive ?? true,
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
        ...(staff?.id ? { id: staff.id } : {}),
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        employment_type: formData.employmentType,
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
                <button 
                    onClick={onCancel}
                    className="text-gray-400 font-bold text-sm flex items-center hover:text-primary transition-colors mb-4"
                >
                    <ChevronLeft size={16} className="mr-1" /> {t('back_to_staff')}
                </button>
        <h1 className="text-4xl font-black text-gray-900">{staff ? t('edit_staff') : t('create_new_staff')}</h1>
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
                        placeholder="VD: khohn01"
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
                        placeholder="VD: Nguyễn Văn"
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
                        placeholder="VD: An"
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
                        placeholder="staff@becshop.vn"
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
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 transition-all font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 0987654321"
                        required
                    />
                    <Phone className="absolute left-4 top-4 text-accent" size={20} />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('work_type_label')}</label>
                <div className="relative">
                    <select
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900 appearance-none"
                    >
                        <option value="Full-time">{t('full_time')}</option>
                        <option value="Part-time">{t('part_time')}</option>
                    </select>
                    <Briefcase className="absolute left-4 top-4 text-primary" size={20} />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{staff ? t('new_password_label') : t('init_password_label')}</label>
                <div className="relative">
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={staff ? t('pwd_leave_empty') : t('pwd_enter_password')}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                        required={!staff}
                    />
                    <Lock className="absolute left-4 top-4 text-primary" size={20} />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('account_status_label')}</label>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
                    <input
                        id="staff-active"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="staff-active" className="text-sm font-bold text-gray-700">
                        {t('allow_staff_account')}
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
                <Save size={20} className="mr-2" /> {saving ? t('saving') : staff ? t('update_staff') : t('finish_registration')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AdminStaffFormView;
