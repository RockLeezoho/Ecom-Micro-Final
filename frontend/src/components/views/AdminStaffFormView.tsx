import React, { useState } from 'react';
import { ChevronLeft, Save, User, Mail, Briefcase, Phone, Lock } from 'lucide-react';
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
      setError(err.message || 'Không thể lưu nhân viên');
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
          <ChevronLeft size={16} className="mr-1" /> Quay lại Danh sách Nhân viên
        </button>
        <h1 className="text-4xl font-black text-gray-900">{staff ? 'Chỉnh sửa nhân viên' : 'Đăng ký nhân viên mới'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-primary/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Tên đăng nhập</label>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Họ đệm</label>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Tên</label>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Địa chỉ Email</label>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Số điện thoại</label>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Hình thức làm việc</label>
                <div className="relative">
                    <select
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900 appearance-none"
                    >
                        <option value="Full-time">Toàn thời gian</option>
                        <option value="Part-time">Bán thời gian</option>
                    </select>
                    <Briefcase className="absolute left-4 top-4 text-primary" size={20} />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{staff ? 'Mật khẩu mới' : 'Mật khẩu khởi tạo'}</label>
                <div className="relative">
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={staff ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu đăng nhập'}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                        required={!staff}
                    />
                    <Lock className="absolute left-4 top-4 text-primary" size={20} />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Trạng thái tài khoản</label>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
                    <input
                        id="staff-active"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="staff-active" className="text-sm font-bold text-gray-700">
                        Cho phép nhân viên đăng nhập và sử dụng hệ thống
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
                Hủy bỏ
            </button>
            <button
                type="submit"
                disabled={saving}
                className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
            >
                <Save size={20} className="mr-2" /> {saving ? 'Đang lưu...' : staff ? 'Cập nhật thành viên' : 'Hoàn tất đăng ký'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AdminStaffFormView;
