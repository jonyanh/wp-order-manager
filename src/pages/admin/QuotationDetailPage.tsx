import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { quotationsService, customersService } from '../../services/db';
import { Quotation, Customer, QuotationStatus } from '../../types';
import { QuotationStatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const q = await quotationsService.getById(id);
      if (!q) return;
      setQuotation(q);
      const c = await customersService.getById(q.customerId);
      setCustomer(c);
    } catch (err: any) {
      error(err.message || 'Lỗi tải báo giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    if (!quotation) return;
    try {
      await quotationsService.update(quotation.id, { status: newStatus });
      success('Cập nhật trạng thái báo giá thành công');
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleConvertToOrder = async () => {
    if (!quotation) return;
    try {
      const order = await quotationsService.convertToOrder(quotation.id);
      success(`Đã chuyển đổi thành công sang Đơn hàng ${order.orderCode}`);
      navigate(`/admin/orders/${order.id}`);
    } catch (err: any) {
      error(err.message || 'Lỗi chuyển đổi');
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  if (!quotation) {
    return <div className="text-center py-12">Không tìm thấy báo giá</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/quotations"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight font-mono">{quotation.quotationCode}</h1>
              <QuotationStatusBadge status={quotation.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{quotation.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/admin/quotations/${quotation.id}/print`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất PDF</span>
          </Link>

          {quotation.status !== 'converted' ? (
            <button
              onClick={handleConvertToOrder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Chuyển thành Đơn Hàng</span>
            </button>
          ) : (
            <Link
              to={`/admin/orders/${quotation.orderId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-xl transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Xem đơn hàng liên kết</span>
            </Link>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Khách Hàng</span>
          <div className="font-bold text-slate-800 text-sm">{customer?.name}</div>
          <div className="text-slate-600">{customer?.phone}</div>
          <div className="text-slate-500">{customer?.email}</div>
          {customer?.company && <div className="text-slate-500">{customer.company}</div>}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Thời Gian Hiệu Lực</span>
          <div>Ngày lập: <span className="font-medium text-slate-800">{formatDate(quotation.createdAt)}</span></div>
          <div>Hạn hiệu lực: <span className="font-bold text-slate-800">{formatDate(quotation.validUntil)}</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng Thái Báo Giá</span>
          <select
            value={quotation.status}
            onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="draft">Bản nháp</option>
            <option value="sent">Đã gửi khách hàng</option>
            <option value="accepted">Khách hàng đã chấp nhận</option>
            <option value="rejected">Từ chối</option>
            <option value="converted">Đã chuyển thành đơn hàng</option>
          </select>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Bảng Báo Giá Chi Tiết</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Hạng mục</th>
                <th className="py-2.5 px-3 text-center">Số lượng</th>
                <th className="py-2.5 px-3 text-right">Đơn giá</th>
                <th className="py-2.5 px-3 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotation.items.map((it, idx) => (
                <tr key={idx}>
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
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          <div className="flex justify-between w-60 text-slate-600">
            <span>Chiết khấu:</span>
            <span>- {formatCurrency(quotation.discount)}</span>
          </div>
          <div className="flex justify-between w-60 text-sm font-bold text-slate-800 pt-1 border-t border-slate-200">
            <span>Tổng chi phí:</span>
            <span className="text-brand-600">{formatCurrency(quotation.total)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Điều Khoản Dịch Vụ</h2>
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{quotation.terms}</p>
      </div>
    </div>
  );
};
