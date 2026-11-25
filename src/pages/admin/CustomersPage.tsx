import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  Trash2,
  Edit2,
  Eye,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';
import { customersService, ordersService } from '../../services/db';
import { Customer, CustomerSource, CustomerStatus } from '../../types';
import { CustomerStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import { SearchBar } from '../../components/common/SearchBar';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    taxCode: '',
    source: 'referral' as CustomerSource,
    status: 'potential' as CustomerStatus,
    note: '',
  });

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { success, error } = useToast();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const list = await customersService.getAll();
      setCustomers(list);
    } catch (err: any) {
      error(err.message || 'Lỗi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      address: '',
      taxCode: '',
      source: 'referral',
      status: 'potential',
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email,
      company: c.company || '',
      address: c.address || '',
      taxCode: c.taxCode || '',
      source: c.source,
      status: c.status,
      note: c.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    try {
      if (editingCustomer) {
        await customersService.update(editingCustomer.id, formData);
        success('Cập nhật khách hàng thành công');
      } else {
        const nextCode = `KH-${String(customers.length + 1).padStart(4, '0')}`;
        await customersService.create({
          customerCode: nextCode,
          ...formData,
        });
        success('Thêm khách hàng mới thành công');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu dữ liệu');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await customersService.softDelete(deleteId);
      success('Đã xóa khách hàng thành công');
      setDeleteId(null);
      loadCustomers();
    } catch (err: any) {
      error(err.message || 'Không thể xóa khách hàng');
    }
  };

  // Filter & Search logic
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      c.customerCode.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSource = sourceFilter === 'all' || c.source === sourceFilter;

    return matchSearch && matchStatus && matchSource;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Danh Sách Khách Hàng</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin đối tác, doanh nghiệp và lịch sử thiết kế website
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm khách hàng..."
        isFiltered={Boolean(search || statusFilter !== 'all' || sourceFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
          setSourceFilter('all');
        }}
        filters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="potential">Tiềm năng</option>
              <option value="active">Đang hợp tác</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="inactive">Ngưng hoạt động</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="referral">Giới thiệu</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="zalo">Zalo</option>
              <option value="direct">Trực tiếp</option>
              <option value="other">Khác</option>
            </select>
          </>
        }
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy khách hàng nào"
          description="Chưa có khách hàng khớp với bộ lọc hoặc danh bạ đang trống."
          action={{
            label: 'Thêm khách hàng mới',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã KH & Tên</th>
                  <th className="py-3 px-4">Công ty / Đơn vị</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Nguồn</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-[11px] font-mono text-brand-600">{c.customerCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.company ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{c.company}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Cá nhân</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 capitalize">
                      {{
                        referral: 'Giới thiệu',
                        facebook: 'Facebook',
                        google: 'Google',
                        zalo: 'Zalo',
                        direct: 'Trực tiếp',
                        other: 'Khác',
                      }[c.source] || c.source}
                    </td>
                    <td className="py-3.5 px-4">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa mềm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Chỉnh Sửa Thông Tin Khách Hàng' : 'Thêm Mới Khách Hàng'}
        description="Điền thông tin liên hệ và doanh nghiệp của khách hàng."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên khách hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Công ty / Doanh nghiệp</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Công ty TNHH ABC"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số thuế</label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                placeholder="0109988776"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Quận Cầu Giấy, Hà Nội"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nguồn khách hàng</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as CustomerSource })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="referral">Người quen giới thiệu</option>
                <option value="facebook">Mạng xã hội Facebook</option>
                <option value="google">Tìm kiếm Google</option>
                <option value="zalo">Zalo</option>
                <option value="direct">Liên hệ trực tiếp</option>
                <option value="other">Nguồn khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="potential">Tiềm năng</option>
                <option value="active">Đang hợp tác</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú nhu cầu website</label>
            <textarea
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Yêu cầu về tông màu, giao diện, ngân sách dự kiến..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
            >
              {editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa khách hàng"
        message="Hệ thống sẽ thực hiện xóa mềm (soft delete). Nếu khách hàng này đã có đơn hàng hoặc giao dịch thanh toán phát sinh, hệ thống sẽ ngăn chặn xóa để bảo toàn dữ liệu tài chính."
        confirmText="Xác nhận xóa"
      />
    </div>
  );
};
