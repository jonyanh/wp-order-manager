import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  Eye,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { quotationsService, customersService } from '../../services/db';
import { Quotation } from '../../types';
import { QuotationStatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { success, error } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, cList] = await Promise.all([
        quotationsService.getAll(),
        customersService.getAll(),
      ]);
      setQuotations(qList);

      const nameMap: Record<string, string> = {};
      cList.forEach((c) => {
        nameMap[c.id] = c.name;
      });
      setCustomerNames(nameMap);
    } catch (err: any) {
      error(err.message || 'Lỗi tải báo giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConvertToOrder = async (quoteId: string) => {
    try {
      const newOrder = await quotationsService.convertToOrder(quoteId);
      success(`Đã chuyển đổi báo giá thành Đơn hàng ${newOrder.orderCode}`);
      navigate(`/admin/orders/${newOrder.id}`);
    } catch (err: any) {
      error(err.message || 'Lỗi khi chuyển đổi thành đơn hàng');
    }
  };

  const filtered = quotations.filter((q) => {
    const custName = customerNames[q.customerId] || '';
    const matchSearch =
      q.quotationCode.toLowerCase().includes(search.toLowerCase()) ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Báo Giá Website</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lập bảng dự toán chi phí, gửi cho khách hàng và chuyển đổi thành đơn hàng với một chạm
          </p>
        </div>
        <Link
          to="/admin/quotations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Lập báo giá mới</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm báo giá (mã BG, khách)..."
        isFiltered={Boolean(search || statusFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="sent">Đã gửi khách</option>
            <option value="accepted">Đã chấp nhận</option>
            <option value="converted">Đã tạo đơn</option>
            <option value="rejected">Từ chối</option>
          </select>
        }
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy báo giá nào"
          description="Bấm 'Lập báo giá mới' để tạo bảng dự toán chuyên nghiệp cho khách hàng."
          action={{
            label: 'Tạo báo giá ngay',
            onClick: () => (window.location.href = '/admin/quotations/new'),
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã & Tiêu đề</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Thời hạn</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/admin/quotations/${quote.id}`}
                        className="font-mono font-bold text-brand-600 hover:text-brand-700 block"
                      >
                        {quote.quotationCode}
                      </Link>
                      <div className="font-semibold text-slate-800 line-clamp-1 mt-0.5">{quote.title}</div>
                      <div className="text-[11px] text-slate-400">Ngày lập: {formatDate(quote.createdAt)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {customerNames[quote.customerId] || 'Khách hàng'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      Hiệu lực đến: <span className="font-medium text-slate-800">{formatDate(quote.validUntil)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <QuotationStatusBadge status={quote.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {quote.status !== 'converted' && (
                          <button
                            onClick={() => handleConvertToOrder(quote.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
                            title="Tạo đơn hàng từ báo giá này"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Tạo đơn</span>
                          </button>
                        )}
                        <Link
                          to={`/admin/quotations/${quote.id}/print`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="In / Xuất PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/quotations/${quote.id}`}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
