import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { ordersService, customersService, settingsService } from '../../services/db';
import { Order, Customer, AppSettings } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const OrderPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [o, s] = await Promise.all([ordersService.getById(id), settingsService.get()]);
        if (o) {
          setOrder(o);
          const c = await customersService.getById(o.customerId);
          setCustomer(c);
        }
        setSettings(s);
      } catch (err) {
        console.error('Error loading print view:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={8} />;

  if (!order) {
    return <div className="text-center py-12">Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <Link
          to={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại chi tiết đơn hàng
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Printer className="w-4 h-4" /> In / Lưu PDF
        </button>
      </div>

      {/* Printable Invoice / Contract Card */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print-card space-y-8">
        {/* Header: Company & Order Code */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {settings?.companyName || 'WP Studio Vietnam'}
            </div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm">
              {settings?.address || 'Tầng 5, Tòa nhà TechHub, Cầu Giấy, Hà Nội'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Hotline: {settings?.phone || '0988 123 456'} • Email: {settings?.email || 'contact@wpstudio.vn'}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">PHIẾU ĐƠN HÀNG DỊCH VỤ</span>
            <div className="text-lg font-mono font-bold text-slate-900 mt-1">{order.orderCode}</div>
            <div className="text-xs text-slate-400 mt-0.5">Ngày lập: {formatDate(order.createdAt)}</div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">BÊN KHÁCH HÀNG</span>
            <div className="font-bold text-slate-900 text-sm">{customer?.name || order.customerName}</div>
            <div className="text-slate-600 mt-0.5">SĐT: {customer?.phone || order.customerPhone}</div>
            <div className="text-slate-600">Email: {customer?.email || order.customerEmail || 'N/A'}</div>
            {customer?.company && <div className="text-slate-600 mt-0.5">Đơn vị: {customer.company}</div>}
          </div>

          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">DỰ ÁN & WEBSITE</span>
            <div className="font-bold text-slate-900">{order.title}</div>
            <div className="text-slate-600 mt-0.5">Tên miền: {order.domain || 'Đang cập nhật'}</div>
            <div className="text-slate-600">Loại website: {order.websiteType}</div>
            <div className="text-slate-600">Hạn bàn giao: {formatDate(order.deadline)}</div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-700">
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3">Hạng mục / Dịch vụ</th>
                <th className="py-2.5 px-3 text-center w-20">SL</th>
                <th className="py-2.5 px-3 text-right w-36">Đơn giá</th>
                <th className="py-2.5 px-3 text-right w-40">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{item.name}</td>
                  <td className="py-3 px-3 text-center">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end text-xs">
          <div className="w-72 space-y-1.5 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
            <div className="flex justify-between text-slate-600">
              <span>Cộng tiền hàng:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Chiết khấu:</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Tổng thanh toán:</span>
              <span className="text-brand-600">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 pt-1">
              <span>Đã thanh toán:</span>
              <span>{formatCurrency(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-600 font-semibold">
              <span>Còn lại (công nợ):</span>
              <span>{formatCurrency(order.remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Bank & Terms */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-800 block mb-1">Thông tin chuyển khoản:</span>
            <div className="text-slate-600">Ngân hàng: {settings?.bankName || 'Techcombank'}</div>
            <div className="text-slate-600">Số tài khoản: {settings?.bankAccount || '190368889999'}</div>
            <div className="text-slate-600">Chủ tài khoản: {settings?.bankHolder || 'NGUYEN VAN QUAN TRI'}</div>
            <div className="text-slate-500 mt-1 italic">Nội dung: {order.orderCode} - Thanh toan website</div>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1">Điều khoản dịch vụ:</span>
            <p className="text-slate-500 leading-relaxed text-[11px] whitespace-pre-line">
              {settings?.defaultTerms || 'Bảo hành 12 tháng kể từ ngày bàn giao source code.'}
            </p>
          </div>
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
          <div>
            <div className="font-bold text-slate-800 uppercase">ĐẠI DIỆN KHÁCH HÀNG</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
            <div className="h-20"></div>
            <div className="font-semibold text-slate-800">{customer?.name || order.customerName}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 uppercase">ĐẠI DIỆN BÊN CUNG CẤP DỊCH VỤ</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
            <div className="h-20"></div>
            <div className="font-semibold text-slate-800">{settings?.bankHolder || 'WP Studio'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
