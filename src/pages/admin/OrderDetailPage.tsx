import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Calendar,
  DollarSign,
  CreditCard,
  FolderKanban,
  ExternalLink,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  ordersService,
  customersService,
  paymentsService,
  projectsService,
} from '../../services/db';
import { Order, Customer, Payment, Project, OrderStatus, PaymentMethod, PaymentType } from '../../types';
import { OrderStatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Payment record modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'bank_transfer' as PaymentMethod,
    paymentType: 'deposit' as PaymentType,
    paymentDate: new Date().toISOString().split('T')[0],
    transactionCode: '',
    note: '',
  });

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const o = await ordersService.getById(id);
      if (!o) return;
      setOrder(o);

      const [c, pList, proj] = await Promise.all([
        customersService.getById(o.customerId),
        paymentsService.getByOrderId(o.id),
        projectsService.getByOrderId(o.id),
      ]);
      setCustomer(c);
      setPayments(pList);
      setProject(proj);

      // Pre-fill remaining amount in payment form
      setPaymentForm((prev) => ({
        ...prev,
        amount: o.remainingAmount || 0,
        note: `Thanh toán cho đơn ${o.orderCode}`,
      }));
    } catch (err: any) {
      error(err.message || 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      await ordersService.update(order.id, { status: newStatus });
      success(`Cập nhật trạng thái sang "${newStatus}" thành công`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (paymentForm.amount <= 0) {
      error('Số tiền thanh toán phải lớn hơn 0');
      return;
    }

    try {
      await paymentsService.addPayment({
        orderId: order.id,
        customerId: order.customerId,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        transactionCode: paymentForm.transactionCode,
        note: paymentForm.note,
      });

      success('Đã ghi nhận thanh toán thành công!');
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi khi ghi nhận thanh toán');
    }
  };

  const handleCreateProject = async () => {
    if (!order) return;
    try {
      const newProj = await projectsService.create({
        orderId: order.id,
        customerId: order.customerId,
        projectName: order.title,
        websiteUrl: order.domain ? `https://${order.domain}` : undefined,
        startDate: order.startDate,
        deadline: order.deadline,
        status: 'in_progress',
      });
      success('Đã khởi tạo dự án với 11 giai đoạn chuẩn WordPress!');
      loadData();
      navigate(`/admin/projects/${newProj.id}`);
    } catch (err: any) {
      error(err.message || 'Lỗi khởi tạo dự án');
    }
  };

  if (loading) return <LoadingSkeleton rows={7} />;

  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy đơn hàng</h3>
        <Link to="/admin/orders" className="text-brand-600 text-xs font-semibold mt-2 inline-block">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight font-mono">{order.orderCode}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{order.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/admin/orders/${order.id}/print`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất PDF</span>
          </Link>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>Ghi nhận thanh toán</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Khách Hàng</h2>
          <div className="text-xs space-y-1.5">
            <div className="font-bold text-slate-800 text-sm">{customer?.name || order.customerName}</div>
            <div className="text-slate-600">{customer?.phone || order.customerPhone}</div>
            <div className="text-slate-500">{customer?.email || order.customerEmail}</div>
            {customer?.company && <div className="text-slate-500 font-medium">{customer.company}</div>}
          </div>
          <Link
            to={`/admin/customers/${order.customerId}`}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-block pt-1"
          >
            Xem hồ sơ khách hàng →
          </Link>
        </div>

        {/* Website & Schedule */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thông Tin Website & Deadline</h2>
          <div className="text-xs space-y-1.5">
            <div>
              <span className="text-slate-400">Loại website: </span>
              <span className="font-semibold text-slate-800">{order.websiteType}</span>
            </div>
            <div>
              <span className="text-slate-400">Tên miền: </span>
              <span className="font-mono font-semibold text-brand-600">{order.domain || 'Chưa cung cấp'}</span>
            </div>
            <div>
              <span className="text-slate-400">Ngày bắt đầu: </span>
              <span className="text-slate-700">{formatDate(order.startDate)}</span>
            </div>
            <div>
              <span className="text-slate-400">Deadline: </span>
              <span className="font-semibold text-slate-800">{formatDate(order.deadline)}</span>
            </div>
          </div>
        </div>

        {/* Financials & Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài Chính & Trạng Thái</h2>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng giá trị:</span>
              <span className="font-bold text-slate-800">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Đã thanh toán:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Còn nợ:</span>
              <span className="font-bold text-amber-600">{formatCurrency(order.remainingAmount)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cập nhật nhanh trạng thái:</label>
            <select
              value={order.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-brand-500"
            >
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
          </div>
        </div>
      </div>

      {/* Project Banner Link */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50/50 p-5 rounded-2xl border border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-brand-900">Tiến Độ Dự Án WordPress</h3>
            <p className="text-xs text-brand-700 mt-0.5">
              {project
                ? `Đang ở giai đoạn ${project.currentStage}/11 • Tiến độ hoàn thành: ${project.progress}%`
                : 'Đơn hàng này chưa tạo lộ trình 11 giai đoạn.'}
            </p>
          </div>
        </div>

        {project ? (
          <Link
            to={`/admin/projects/${project.id}`}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition whitespace-nowrap self-start sm:self-auto"
          >
            Xem bảng tiến độ dự án →
          </Link>
        ) : (
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition whitespace-nowrap self-start sm:self-auto"
          >
            Khởi tạo dự án WordPress (11 giai đoạn)
          </button>
        )}
      </div>

      {/* Items Breakdown Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Bảng Hạng Mục Đơn Hàng</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Hạng mục / Dịch vụ</th>
                <th className="py-2.5 px-3 text-center">Số lượng</th>
                <th className="py-2.5 px-3 text-right">Đơn giá</th>
                <th className="py-2.5 px-3 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-medium text-slate-800">{it.name}</td>
                  <td className="py-3 px-3 text-center">{it.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatCurrency(it.unitPrice)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">{formatCurrency(it.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col items-end space-y-1 text-xs">
          <div className="flex justify-between w-60 text-slate-600">
            <span>Tạm tính:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between w-60 text-slate-600">
            <span>Chiết khấu:</span>
            <span>- {formatCurrency(order.discount)}</span>
          </div>
          <div className="flex justify-between w-60 text-sm font-bold text-slate-800 pt-1 border-t border-slate-200">
            <span>Tổng cộng:</span>
            <span className="text-brand-600">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment History Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Lịch Sử Giao Dịch Thanh Toán ({payments.length})</h2>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Ghi nhận thanh toán mới
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Chưa ghi nhận giao dịch thanh toán nào.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{p.note || 'Thanh toán'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mã GD: {p.transactionCode || 'N/A'} • Phương thức: {p.paymentMethod} • Ngày: {formatDate(p.paymentDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 text-sm">{formatCurrency(p.amount)}</div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{p.paymentType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Ghi Nhận Giao Dịch Thanh Toán"
        description="Ghi nhận đặt cọc hoặc thanh toán từng đợt của khách hàng"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1000}
              step={10000}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Công nợ còn lại của đơn hàng: <strong className="text-amber-600">{formatCurrency(order.remainingAmount)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại thanh toán</label>
              <select
                value={paymentForm.paymentType}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="deposit">Đặt cọc đợt 1</option>
                <option value="installment">Thanh toán theo tiến độ</option>
                <option value="final">Nghiệm thu đợt cuối</option>
                <option value="full">Thanh toán 100%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phương thức</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                <option value="cash">Tiền mặt</option>
                <option value="momo">Ví MoMo</option>
                <option value="vnpay">VNPay</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày chuyển tiền</label>
              <input
                type="date"
                required
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã giao dịch / UNC</label>
              <input
                type="text"
                placeholder="VD: FT2403988..."
                value={paymentForm.transactionCode}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú giao dịch</label>
            <input
              type="text"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              Lưu thanh toán
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
