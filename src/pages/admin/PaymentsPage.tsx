import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { paymentsService, ordersService, customersService } from '../../services/db';
import { Payment, Order, Customer, PaymentMethod, PaymentType } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    customerId: '',
    amount: 0,
    paymentMethod: 'bank_transfer' as PaymentMethod,
    paymentType: 'deposit' as PaymentType,
    paymentDate: new Date().toISOString().split('T')[0],
    transactionCode: '',
    note: '',
  });

  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, oList, cList] = await Promise.all([
        paymentsService.getAll(),
        ordersService.getAll(),
        customersService.getAll(),
      ]);
      setPayments(pList);
      setOrders(oList);

      const cMap: Record<string, Customer> = {};
      cList.forEach((c) => {
        cMap[c.id] = c;
      });
      setCustomers(cMap);

      if (oList.length > 0 && !paymentForm.orderId) {
        setPaymentForm((prev) => ({
          ...prev,
          orderId: oList[0].id,
          customerId: oList[0].customerId,
          amount: oList[0].remainingAmount || 0,
        }));
      }
    } catch (err: any) {
      error(err.message || 'Lỗi tải dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderSelect = (orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (o) {
      setPaymentForm((prev) => ({
        ...prev,
        orderId: o.id,
        customerId: o.customerId,
        amount: o.remainingAmount || 0,
        note: `Thanh toán cho đơn ${o.orderCode}`,
      }));
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.orderId) {
      error('Vui lòng chọn đơn hàng');
      return;
    }
    if (paymentForm.amount <= 0) {
      error('Số tiền phải lớn hơn 0');
      return;
    }

    try {
      await paymentsService.addPayment({
        orderId: paymentForm.orderId,
        customerId: paymentForm.customerId,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        transactionCode: paymentForm.transactionCode,
        note: paymentForm.note,
      });

      success('Đã ghi nhận thanh toán thành công!');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi khi ghi nhận thanh toán');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã GD', 'Mã Đơn', 'Khách hàng', 'Số tiền', 'Phương thức', 'Loại thanh toán', 'Ngày', 'Ghi chú'];
    const rows = filtered.map((p) => {
      const order = orders.find((o) => o.id === p.orderId);
      const customer = customers[p.customerId];
      return [
        p.transactionCode || 'N/A',
        order?.orderCode || 'N/A',
        customer?.name || 'Khách hàng',
        p.amount,
        p.paymentMethod,
        p.paymentType,
        p.paymentDate,
        p.note || '',
      ];
    });
    exportToCSV(`bao-cao-thanh-toan-${new Date().toISOString().split('T')[0]}`, headers, rows);
    success('Đã xuất file báo cáo thanh toán CSV thành công!');
  };

  // Calculations
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDeposit = payments
    .filter((p) => p.paymentType === 'deposit')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalInstallment = payments
    .filter((p) => p.paymentType === 'installment')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalFinal = payments
    .filter((p) => p.paymentType === 'final' || p.paymentType === 'full')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const filtered = payments.filter((p) => {
    const order = orders.find((o) => o.id === p.orderId);
    const customer = customers[p.customerId];

    const matchSearch =
      (p.transactionCode && p.transactionCode.toLowerCase().includes(search.toLowerCase())) ||
      (order && order.orderCode.toLowerCase().includes(search.toLowerCase())) ||
      (customer && customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.note && p.note.toLowerCase().includes(search.toLowerCase()));

    const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    const matchType = typeFilter === 'all' || p.paymentType === typeFilter;

    return matchSearch && matchMethod && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Thanh Toán & Thu Chi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận đặt cọc, thanh toán nhiều đợt và theo dõi dòng tiền thực tế
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel/CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận thanh toán</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Tổng thực thu</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</div>
          <span className="text-[10px] text-slate-400">{payments.length} lượt giao dịch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Tiền đặt cọc</span>
          <div className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totalDeposit)}</div>
          <span className="text-[10px] text-slate-400">Giai đoạn ký hợp đồng</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Theo tiến độ</span>
          <div className="text-xl font-bold text-brand-600 mt-1">{formatCurrency(totalInstallment)}</div>
          <span className="text-[10px] text-slate-400">Các đợt triển khai</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Nghiệm thu / Tất toán</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">{formatCurrency(totalFinal)}</div>
          <span className="text-[10px] text-slate-400">Bàn giao website hoàn tất</span>
        </div>
      </div>

      {/* Filter and Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm giao dịch, mã đơn..."
        isFiltered={Boolean(search || typeFilter !== 'all' || methodFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setTypeFilter('all');
          setMethodFilter('all');
        }}
        filters={
          <>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="deposit">Đặt cọc</option>
              <option value="installment">Theo tiến độ</option>
              <option value="final">Nghiệm thu đợt cuối</option>
              <option value="full">Toàn bộ 100%</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="cash">Tiền mặt</option>
              <option value="momo">Ví MoMo</option>
              <option value="vnpay">VNPay</option>
              <option value="other">Khác</option>
            </select>
          </>
        }
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy giao dịch nào"
          description="Chưa có dữ liệu thanh toán khớp với tìm kiếm."
          action={{
            label: 'Ghi nhận thanh toán mới',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Ngày GD</th>
                  <th className="py-3 px-4">Mã GD & Đơn hàng</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Số tiền</th>
                  <th className="py-3 px-4">Phương thức</th>
                  <th className="py-3 px-4">Loại thanh toán</th>
                  <th className="py-3 px-4">Nội dung ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const order = orders.find((o) => o.id === p.orderId);
                  const customer = customers[p.customerId];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800">{p.transactionCode || 'N/A'}</div>
                        {order && (
                          <span className="font-mono text-[11px] text-brand-600 block mt-0.5">
                            {order.orderCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{customer?.name || order?.customerName}</div>
                        <div className="text-[11px] text-slate-400">{customer?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {{
                          bank_transfer: 'Chuyển khoản',
                          cash: 'Tiền mặt',
                          momo: 'Ví MoMo',
                          vnpay: 'VNPay',
                          other: 'Khác',
                        }[p.paymentMethod] || p.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          {{
                            deposit: 'Đặt cọc',
                            installment: 'Theo tiến độ',
                            final: 'Nghiệm thu',
                            full: 'Tất toán 100%',
                          }[p.paymentType] || p.paymentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {p.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ghi Nhận Giao Dịch Thu Tiền"
        description="Ghi nhận số tiền khách hàng đã thanh toán vào đơn hàng"
        maxWidth="md"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn đơn hàng cần ghi nhận <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={paymentForm.orderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderCode} - {o.customerName} (Còn nợ: {formatCurrency(o.remainingAmount)})
                </option>
              ))}
            </select>
          </div>

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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại thanh toán</label>
              <select
                value={paymentForm.paymentType}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="deposit">Đặt cọc</option>
                <option value="installment">Theo tiến độ</option>
                <option value="final">Nghiệm thu cuối</option>
                <option value="full">Tất toán 100%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phương thức</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="momo">MoMo</option>
                <option value="vnpay">VNPay</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày giao dịch</label>
              <input
                type="date"
                required
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã tham chiếu / GD</label>
              <input
                type="text"
                placeholder="VD: FT2602..."
                value={paymentForm.transactionCode}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              Lưu giao dịch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
