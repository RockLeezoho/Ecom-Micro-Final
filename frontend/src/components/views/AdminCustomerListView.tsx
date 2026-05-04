import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, User, Mail, Phone, Ruler, Weight } from 'lucide-react';
import { User as UserType } from '../../types';

interface AdminCustomerListProps {
  customerList: UserType[];
  loading?: boolean;
  error?: string | null;
  onAdd: () => void;
  onEdit: (customer: UserType) => void;
  onDelete: (id: string) => void;
}

const AdminCustomerListView: React.FC<AdminCustomerListProps> = ({
  customerList,
  loading = false,
  error = null,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customerList
    .filter((user) => user.role === 'customer')
    .filter((user) => {
      const keyword = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        (user.username || '').toLowerCase().includes(keyword) ||
        (user.phoneNumber || '').toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Quản lý khách hàng</h1>
          <p className="text-gray-500 font-medium">Theo dõi hồ sơ và trạng thái tài khoản khách hàng trong hệ thống.</p>
        </div>
        <button
          onClick={onAdd}
          className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={18} className="mr-2" /> Tạo khách hàng mới
        </button>
      </div>

      <div className="mb-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative md:max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên, email, username hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-24 text-center text-gray-400 font-medium">Đang tải danh sách khách hàng...</div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="h-16 w-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
                  <User size={32} />
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => onEdit(customer)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-xl transition-all">
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}" không?`)) {
                        onDelete(customer.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-1">{customer.name}</h3>
              <div className="text-primary font-bold text-xs uppercase tracking-widest mb-6">@{customer.username || customer.id}</div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <Mail size={16} className="mr-3 text-gray-300" /> {customer.email}
                </div>
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <Phone size={16} className="mr-3 text-gray-300" /> {customer.phoneNumber || 'Chưa cập nhật'}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <span className="inline-flex items-center"><Ruler size={14} className="mr-1 text-gray-300" /> {customer.height ?? '-'} cm</span>
                  <span className="inline-flex items-center"><Weight size={14} className="mr-1 text-gray-300" /> {customer.weight ?? '-'} kg</span>
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  customer.isActive ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {customer.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6">
              <Search size={48} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">Không tìm thấy khách hàng phù hợp.</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomerListView;
