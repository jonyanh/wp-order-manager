import React, { useEffect, useState } from 'react';
import { CreditCard, QrCode, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentsService, settingsService, ordersService } from '../../services/db';
import { Payment, AppSettings, Order } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerPaymentsPage: React.FC = () => {
  const { customerId } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!customerId) return;
      try {
        setLoading(true);
        const [pList, s, oList] = await Promise.all([
          paymentsService.getByCustomerId(customerId),
          settingsService.get(),
          ordersService.getByCustomerId(customerId),
        ]);
        setPayments(pList);
        setSettings(s);
        setOrders(oList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  if (loading) return <LoadingSkeleton rows={5} />;

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum), 0);
  const remaining = Math.max(0, totalDue - totalPaid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Lịch Sử Thanh Toán & Hướng Dẫn Chuyển Khoản</h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi minh bạch các khoản tiền đã đặt cọc, thanh toán và thông tin số tài khoản chính thức
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng Chi Phí Hợp Đồng</span>
          <div className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totalDue)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Đã Thanh Toán Thành Công</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Số Tiền Còn Lại Cần Thu</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(remaining)}</div>
        </div>
      </div>

      {/* Bank Account & VietQR Card */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-brand-50/50 p-6 rounded-2xl border border-brand-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex items-center justify-center">
            {settings?.vietQrUrl ? (
              <img
                src={settings.vietQrUrl}
                alt="VietQR Chuyển Khoản"
                className="w-full h-full object-contain"
              />
            ) : (
              <QrCode className="w-16 h-16 text-brand-600" />
            )}
          </div>

          <div className="space-y-2 text-xs flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
              THÔNG TIN TÀI KHOẢN NGÂN HÀNG CHÍNH THỨC
            </span>
            <div className="text-sm font-bold text-slate-800">
              Ngân hàng: <span className="text-brand-700">{settings?.bankName || 'Techcombank'}</span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
              STK: {settings?.bankAccount || '190368889999'}
            </div>
            <div className="text-slate-700 font-medium">
              Chủ tài khoản: <span className="uppercase font-bold">{settings?.bankHolder || 'NGUYEN VAN QUAN TRI'}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              * Cú pháp chuyển khoản: <strong>[Mã đơn hàng] - [Số điện thoại của bạn]</strong>. Hệ thống sẽ ghi nhận và gửi thông báo xác nhận ngay sau khi nhận được tiền.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Lịch Sử Giao Dịch Đã Ghi Nhận ({payments.length})</h2>

        {payments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Chưa có giao dịch thanh toán nào.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map((p) => (
              <div key={p.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{p.note || 'Thanh toán đơn hàng'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ngày thanh toán: {formatDate(p.paymentDate)} • Mã tham chiếu: {p.transactionCode || 'N/A'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">{formatCurrency(p.amount)}</div>
                  <span className="text-[10px] text-slate-500 font-medium uppercase">{p.paymentType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
