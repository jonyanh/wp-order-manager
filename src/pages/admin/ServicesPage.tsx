import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { servicesService } from '../../services/db';
import { ServiceItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit: 'gói',
    defaultPrice: 0,
    category: 'Thiết kế web',
    active: true,
  });

  const { success, error } = useToast();

  const loadServices = async () => {
    try {
      setLoading(true);
      const list = await servicesService.getAll();
      setServices(list);
    } catch (err: any) {
      error(err.message || 'Lỗi tải danh mục dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      code: `SRV-${String(services.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      unit: 'gói',
      defaultPrice: 5000000,
      category: 'Thiết kế web',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setFormData({
      code: srv.code,
      name: srv.name,
      description: srv.description || '',
      unit: srv.unit,
      defaultPrice: srv.defaultPrice,
      category: srv.category,
      active: srv.active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Vui lòng nhập tên dịch vụ');
      return;
    }

    try {
      if (editingService) {
        await servicesService.update(editingService.id, formData);
        success('Cập nhật dịch vụ thành công');
      } else {
        await servicesService.create(formData);
        success('Thêm dịch vụ mới thành công');
      }
      setIsModalOpen(false);
      loadServices();
    } catch (err: any) {
      error(err.message || 'Lỗi lưu dịch vụ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await servicesService.delete(deleteId);
      success('Đã xóa dịch vụ');
      setDeleteId(null);
      loadServices();
    } catch (err: any) {
      error(err.message || 'Không thể xóa');
    }
  };

  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = ['all', 'Thiết kế web', 'Tên miền/Hosting', 'Tính năng thêm', 'Bảo trì'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Bảng Giá Dịch Vụ Mẫu</h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh mục đơn giá tiêu chuẩn dùng cho tạo Báo giá và Đơn hàng nhanh
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>

      {/* Filter and search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm dịch vụ..."
        isFiltered={Boolean(search || categoryFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setCategoryFilter('all');
        }}
        filters={
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  categoryFilter === c
                    ? 'bg-brand-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {c === 'all' ? 'Tất cả' : c}
              </button>
            ))}
          </div>
        }
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy dịch vụ nào"
          description="Bấm 'Thêm dịch vụ mới' để tạo gói thiết kế website hoặc dịch vụ lưu trữ."
          action={{ label: 'Thêm dịch vụ', onClick: handleOpenCreate }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Mã & Tên dịch vụ</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Đơn giá mặc định</th>
                <th className="py-3 px-4">Đơn vị tính</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{s.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{s.description || '-'}</div>
                    <span className="font-mono text-[10px] text-brand-600 font-semibold">{s.code}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{s.category}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">{formatCurrency(s.defaultPrice)}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.unit}</td>
                  <td className="py-3.5 px-4">
                    {s.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" /> Đang dùng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <XCircle className="w-3.5 h-3.5" /> Ẩn
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
      )}

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã dịch vụ</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phân loại</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="Thiết kế web">Thiết kế web</option>
                <option value="Tên miền/Hosting">Tên miền/Hosting</option>
                <option value="Tính năng thêm">Tính năng thêm</option>
                <option value="Bảo trì">Bảo trì</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên dịch vụ / Gói web</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Website Bán hàng WooCommerce"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn giá mặc định (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={50000}
                value={formData.defaultPrice}
                onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="gói, năm, tháng, cái..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chi tiết</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Các hạng mục bao gồm trong gói dịch vụ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="activeCheckbox" className="text-xs font-medium text-slate-700">
              Kích hoạt hiển thị trong danh mục lựa chọn
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
            >
              Lưu dịch vụ
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa dịch vụ này?"
        message="Hành động này sẽ xóa gói dịch vụ khỏi danh mục mẫu."
      />
    </div>
  );
};
