import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { ordersService, customersService } from '../../services/db';
import { Order, OrderStatus } from '../../types';
import { OrderStatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchParams] = useSearchParams();

  const { error } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const list = await ordersService.getAll();
      setOrders(list);
    } catch (err: any) {
      error(err.message || 'Lỗi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const queryStatus = searchParams.get('status');
    if (queryStatus) {
      setStatusFilter(queryStatus);
    }
  }, [searchParams]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (o.domain && o.domain.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum), 0);
  const totalPaid = orders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
  const totalDebt = Math.max(0, totalRevenue - totalPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Đơn Hàng Website</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tất cả đơn hàng, hợp đồng thiết kế WordPress và tiến độ thanh toán
          </p>
        </div>
        <Link
          to="/admin/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn hàng mới</span>
        </Link>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Tổng đơn hàng</span>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{orders.length}</div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Tổng giá trị đơn</span>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{formatCurrency(totalRevenue)}</div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Đã thu thực tế</span>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(totalPaid)}</div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Công nợ còn lại</span>
          <div className="text-lg font-bold text-amber-600 mt-0.5">{formatCurrency(totalDebt)}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm đơn hàng (mã WP, khách, domain)..."
        isFiltered={Boolean(search || statusFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 focus:outline-none w-full md:w-auto"
          >
            <option value="all">Tất cả trạng thái ({orders.length})</option>
            <option value="new">Mới</option>
            <option value="consulting">Đang tư vấn</option>
            <option value="quote_sent">Đã gửi báo giá</option>
            <option value="pending_confirm">Chờ xác nhận</option>
            <option value="deposited">Đã đặt cọc</option>
            <option value="in_progress">Đang triển khai</option>
            <option value="review">Chờ duyệt</option>
            <option value="revising">Đang chỉnh sửa</option>
            <option value="accepted">Đã nghiệm thu</option>
            <option value="paid">Đã thanh toán</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        }
      />

      {/* Orders Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy đơn hàng nào"
          description="Chưa có đơn hàng nào khớp với tìm kiếm hoặc bộ lọc trạng thái."
          action={{
            label: 'Tạo đơn hàng ngay',
            onClick: () => (window.location.href = '/admin/orders/new'),
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đơn & Website</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Đã thu / Còn lại</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const isOverdue =
                    order.status !== 'completed' &&
                    order.status !== 'cancelled' &&
                    new Date(order.deadline) < new Date();

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-brand-600 hover:text-brand-700 block"
                        >
                          {order.orderCode}
                        </Link>
                        <div className="font-semibold text-slate-800 line-clamp-1 mt-0.5">{order.title}</div>
                        {order.domain && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            {order.domain}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{order.customerName || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-emerald-600 font-semibold">{formatCurrency(order.paidAmount)}</div>
                        <div className="text-[11px] text-amber-600">
                          Còn nợ: {formatCurrency(order.remainingAmount)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {formatDate(order.deadline)}
                        </div>
                        {isOverdue && <span className="text-[10px] text-rose-500 font-semibold">Quá hạn!</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/orders/${order.id}/print`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="In / Xuất PDF đơn hàng"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
