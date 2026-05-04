import React, { useEffect, useState } from 'react';
import { Save, User as UserIcon, Phone, Calendar, Users2 } from 'lucide-react';
import type { User } from '../../types';
import { fetchCustomerProfile, updateCustomerProfile } from '../../services/customerService';

interface CustomerProfileViewProps {
  currentUser: User | null;
  onUserUpdated?: (user: User) => void;
}

const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({ currentUser, onUserUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '' as string,
    gender: '' as string,
    height: '' as string,
    weight: '' as string,
    foot_length: '' as string,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchCustomerProfile();
        setForm({
          first_name: profile.firstName || '',
          last_name: profile.lastName || '',
          phone_number: profile.phoneNumber || '',
          date_of_birth: (profile.dateOfBirth as any) || '',
          gender: (profile.gender as any) || '',
          height: profile.height != null ? String(profile.height) : '',
          weight: profile.weight != null ? String(profile.weight) : '',
          foot_length: profile.footLength != null ? String(profile.footLength) : '',
        });
      } catch (err: any) {
        setError(err.message || 'Không thể tải hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.role === 'customer') load();
  }, [currentUser]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCustomerProfile({
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        phone_number: form.phone_number || undefined,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        foot_length: form.foot_length ? Number(form.foot_length) : null,
      });
      onUserUpdated?.({ ...currentUser!, ...updated });
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== 'customer') {
    return <div className="p-8 text-center text-gray-400">Vui lòng đăng nhập tài khoản khách hàng.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Hồ sơ khách hàng</h1>
          <p className="text-gray-500 font-medium">Cập nhật thông tin cá nhân và số đo (nếu cần).</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
          <UserIcon size={22} />
        </div>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-gray-400">Đang tải hồ sơ...</div>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Họ đệm</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tên</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Phone size={14} /> Số điện thoại</label>
              <input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Calendar size={14} /> Ngày sinh</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2"><Users2 size={14} /> Giới tính</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
              >
                <option value="">Chưa chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Số đo (tuỳ chọn)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Chiều cao (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cân nặng (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Bàn chân (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.foot_length}
                  onChange={(e) => setForm({ ...form, foot_length: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
          >
            <Save size={18} className="mr-2" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CustomerProfileView;
