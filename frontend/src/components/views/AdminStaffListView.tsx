import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, User, Mail, CreditCard, Phone } from 'lucide-react';
import { User as UserType } from '../../types';

interface AdminStaffListProps {
  staffList: UserType[];
  loading?: boolean;
  error?: string | null;
  onAdd: () => void;
  onEdit: (staff: UserType) => void;
  onDelete: (id: string) => void;
}

const AdminStaffListView: React.FC<AdminStaffListProps> = ({ staffList, loading = false, error = null, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredStaff = staffList
    .filter(u => u.role === 'staff')
    .filter(u => {
      const keyword = searchTerm.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(keyword) ||
                            (u.staffCode && u.staffCode.toLowerCase().includes(keyword)) ||
                            (u.phoneNumber && u.phoneNumber.toLowerCase().includes(keyword));
      const matchesType = filterType === 'all' || u.employmentType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản lý nhân viên</h1>
          <p className="text-gray-500 font-medium">Quản lý các thành viên, vai trò và tình trạng làm việc của họ.</p>
        </div>
        <button 
           onClick={onAdd}
           className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:opacity-90 shadow-lg shadow-primary/20 transition-all font-bold"
        >
          <Plus size={18} className="mr-2" /> Đăng ký nhân viên mới
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 md:max-w-md">
          <input 
            type="text"
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>
        
        <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Hình thức:</span>
            <div className="flex p-1 bg-gray-50 rounded-xl">
            {(['all', 'Full-time', 'Part-time'] as const).map(type => (
                <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterType === type ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-700'
                }`}
                >
                {type === 'all' ? 'Tất cả' : type === 'Full-time' ? 'Toàn thời gian' : 'Bán thời gian'}
                </button>
            ))}
            </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-24 text-center text-gray-400 font-medium">Đang tải danh sách nhân viên...</div>
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map(staff => (
            <div key={staff.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 hover:border-accent transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-16 w-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <User size={32} />
                </div>
                <div className="flex space-x-1">
                    <button 
                         onClick={() => onEdit(staff)}
                         className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-xl transition-all"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${staff.name}" không?`)) {
                                onDelete(staff.id);
                            }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-1">{staff.name}</h3>
              <div className="flex items-center text-primary font-bold text-xs uppercase tracking-widest mb-6">
                <CreditCard size={12} className="mr-1.5" /> {staff.staffCode}
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <Mail size={16} className="mr-3 text-gray-300" /> {staff.email}
                </div>
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <Phone size={16} className="mr-3 text-gray-300" /> {staff.phoneNumber || 'Chưa cập nhật'}
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    staff.employmentType === 'Full-time' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                }`}>
                    {staff.employmentType === 'Full-time' ? 'Toàn thời gian' : 'Bán thời gian'}
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  staff.isActive ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {staff.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </div>
              </div>
              
              <div className="w-full py-4 border-2 border-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">
                @{staff.username || staff.staffCode}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
             <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6">
                <Search size={48} className="text-gray-200" />
             </div>
             <h3 className="text-xl font-bold text-gray-400">Không tìm thấy thành viên nào phù hợp.</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStaffListView;
