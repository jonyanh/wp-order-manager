import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ShoppingBag,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { customersService, ordersService, paymentsService } from '../../services/db';
import { Customer, Order, Payment } from '../../types';
import { CustomerStatusBadge, OrderStatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        setLoading(true);
        const [c, oList, pList] = await Promise.all([
          customersService.getById(id),
          ordersService.getByCustomerId(id),
          paymentsService.getByCustomerId(id),
        ]);
        setCustomer(c);
        setOrders(oList);
        setPayments(pList);
      } catch (err) {
        console.error('Error loading customer detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={6} />;

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy khách hàng</h3>
        <Link to="/admin/customers" className="text-brand-600 text-xs font-semibold mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const remainingDebt = Math.max(0, totalSpent - totalPaid);

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/customers"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{customer.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md font-medium text-brand-600">
                {customer.customerCode}
              </span>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Khách hàng được tạo ngày {formatDate(customer.createdAt)}</p>
          </div>
        </div>

        <Link
          to={`/admin/orders/new?customerId=${customer.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn hàng cho khách này</span>
        </Link>
      </div>

      {/* Customer Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Thông Tin Liên Hệ</h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.email || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.company || 'Cá nhân'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.address || 'Chưa có địa chỉ'}</span>
            </div>
            {customer.taxCode && (
              <div className="flex items-center gap-2 text-slate-700">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>MST: {customer.taxCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tổng Kết Tài Chính</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tổng giá trị đơn hàng:</span>
              <span className="font-bold text-slate-800">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Đã thanh toán:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Công nợ hiện tại:</span>
              <span className="font-bold text-amber-600">{formatCurrency(remainingDebt)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ghi Chú & Đặc Điểm</h2>
          <p className="text-xs text-slate-600 leading-relaxed italic">
            {customer.note || 'Chưa có ghi chú nào cho khách hàng này.'}
          </p>
        </div>
      </div>

      {/* Orders List for this customer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Lịch Sử Đơn Hàng ({orders.length})</h2>
        </div>

        {orders.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Khách hàng chưa có đơn hàng nào.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-800 text-xs">{order.orderCode}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-slate-700 font-medium">{order.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Hạn: {formatDate(order.deadline)} • Website: {order.domain || 'Chưa gán'}
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{formatCurrency(order.total)}</div>
                    <div className="text-[10px] text-slate-400">Đã trả: {formatCurrency(order.paidAmount)}</div>
                  </div>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments History for this customer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Lịch Sử Giao Dịch Đã Thu ({payments.length})</h2>
        {payments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Chưa có giao dịch thanh toán nào được ghi nhận.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{p.note || 'Thanh toán đơn hàng'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mã GD: {p.transactionCode || 'N/A'} • Phương thức: {p.paymentMethod} • Ngày: {formatDate(p.paymentDate)}
                  </div>
                </div>
                <div className="font-bold text-emerald-600 text-sm">{formatCurrency(p.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
