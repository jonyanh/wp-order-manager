import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Server,
  Lock,
  Edit2,
} from 'lucide-react';
import { hostingDomainsService, customersService, ordersService } from '../../services/db';
import { HostingDomain, Customer, Order } from '../../types';
import { formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const HostingDomainsPage: React.FC = () => {
  const [list, setList] = useState<HostingDomain[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HostingDomain | null>(null);

  const [form, setForm] = useState({
    customerId: '',
    orderId: '',
    domain: '',
    hostingProvider: '',
    domainExpiry: '',
    hostingExpiry: '',
    sslExpiry: '',
    websiteUrl: '',
    note: '',
    hasAdminCredentials: true,
  });

  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [hdList, cList, oList] = await Promise.all([
        hostingDomainsService.getAll(),
        customersService.getAll(),
        ordersService.getAll(),
      ]);
      setList(hdList);
      setCustomers(cList);
      setOrders(oList);

      if (cList.length > 0 && !form.customerId) {
        setForm((prev) => ({ ...prev, customerId: cList[0].id }));
      }
    } catch (err: any) {
      error(err.message || 'Lỗi tải dữ liệu hosting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setForm({
      customerId: customers[0]?.id || '',
      orderId: '',
      domain: '',
      hostingProvider: 'AZDIGI NVMe',
      domainExpiry: oneYearLater,
      hostingExpiry: oneYearLater,
      sslExpiry: threeMonthsLater,
      websiteUrl: '',
      note: 'DNS trỏ Cloudflare. Chứng chỉ SSL tự động gia hạn.',
      hasAdminCredentials: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HostingDomain) => {
    setEditingItem(item);
    setForm({
      customerId: item.customerId,
      orderId: item.orderId || '',
      domain: item.domain,
      hostingProvider: item.hostingProvider,
      domainExpiry: item.domainExpiry,
      hostingExpiry: item.hostingExpiry,
      sslExpiry: item.sslExpiry,
      websiteUrl: item.websiteUrl,
      note: item.note || '',
      hasAdminCredentials: Boolean(item.hasAdminCredentials),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.domain.trim()) {
      error('Vui lòng nhập tên miền');
      return;
    }

    try {
      if (editingItem) {
        await hostingDomainsService.update(editingItem.id, form);
        success('Cập nhật bản ghi thành công');
      } else {
        await hostingDomainsService.create(form);
        success('Thêm tên miền & hosting thành công');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi lưu thông tin');
    }
  };

  // Expiry check (days left)
  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = list.filter((item) => {
    const cust = customers.find((c) => c.id === item.customerId);
    const matchSearch =
      item.domain.toLowerCase().includes(search.toLowerCase()) ||
      item.hostingProvider.toLowerCase().includes(search.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(search.toLowerCase()));

    const daysLeftDomain = getDaysLeft(item.domainExpiry);
    const daysLeftHost = getDaysLeft(item.hostingExpiry);

    let matchExpiry = true;
    if (expiryFilter === 'soon') {
      matchExpiry = (daysLeftDomain <= 30 && daysLeftDomain >= 0) || (daysLeftHost <= 30 && daysLeftHost >= 0);
    } else if (expiryFilter === 'expired') {
      matchExpiry = daysLeftDomain < 0 || daysLeftHost < 0;
    }

    return matchSearch && matchExpiry;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Tên Miền & Hosting</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thời hạn bản quyền domain, máy chủ lưu trữ và chứng chỉ bảo mật SSL
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm tên miền / Hosting</span>
        </button>
      </div>

      {/* Filter and search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm tên miền, hosting..."
        isFiltered={Boolean(search || expiryFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setExpiryFilter('all');
        }}
        filters={
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">Tất cả thời hạn</option>
            <option value="soon">Sắp hết hạn trong 30 ngày</option>
            <option value="expired">Đã quá hạn</option>
          </select>
        }
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Globe className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy tên miền nào"
          description="Bấm 'Thêm tên miền / Hosting' để bắt đầu quản lý ngày hết hạn dịch vụ."
          action={{ label: 'Thêm mới', onClick: handleOpenCreate }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Tên miền & Website</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Nhà cung cấp</th>
                  <th className="py-3 px-4">Hết hạn Domain</th>
                  <th className="py-3 px-4">Hết hạn Hosting</th>
                  <th className="py-3 px-4">Chứng chỉ SSL</th>
                  <th className="py-3 px-4">Bảo mật</th>
                  <th className="py-3 px-4 text-right">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const cust = customers.find((c) => c.id === item.customerId);
                  const daysLeftDomain = getDaysLeft(item.domainExpiry);
                  const daysLeftHost = getDaysLeft(item.hostingExpiry);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800 text-sm">{item.domain}</div>
                        {item.websiteUrl && (
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700 font-mono mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{item.websiteUrl}</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cust?.name || 'Khách hàng'}</div>
                        <div className="text-[11px] text-slate-400">{cust?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{item.hostingProvider}</td>
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-semibold ${
                            daysLeftDomain <= 30 ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {formatDate(item.domainExpiry)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {daysLeftDomain < 0 ? 'Đã hết hạn!' : `Còn ${daysLeftDomain} ngày`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-semibold ${
                            daysLeftHost <= 30 ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {formatDate(item.hostingExpiry)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {daysLeftHost < 0 ? 'Đã hết hạn!' : `Còn ${daysLeftHost} ngày`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>HTTPS Active</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>•••••••• (Encrypted)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Chỉnh Sửa Tên Miền & Hosting' : 'Thêm Mới Tên Miền / Hosting'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khách hàng sở hữu</label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên miền (Domain) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="example.com"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nhà cung cấp hosting</label>
              <input
                type="text"
                value={form.hostingProvider}
                onChange={(e) => setForm({ ...form, hostingProvider: e.target.value })}
                placeholder="VD: AZDIGI, Hostinger, PA Việt Nam..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đường dẫn website (URL)</label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hết hạn Domain</label>
              <input
                type="date"
                required
                value={form.domainExpiry}
                onChange={(e) => setForm({ ...form, domainExpiry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hết hạn Hosting</label>
              <input
                type="date"
                required
                value={form.hostingExpiry}
                onChange={(e) => setForm({ ...form, hostingExpiry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hết hạn SSL</label>
              <input
                type="date"
                value={form.sslExpiry}
                onChange={(e) => setForm({ ...form, sslExpiry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú kỹ thuật DNS / Cpanel</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Thông tin trỏ IP, Cloudflare nameservers (Không lưu mật khẩu plain text)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
