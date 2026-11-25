import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Printer, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { quotationsService } from '../../services/db';
import { Quotation } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { QuotationStatusBadge } from '../../components/common/Badge';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerQuotationsPage: React.FC = () => {
  const { customerId } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!customerId) return;
      try {
        setLoading(true);
        const list = await quotationsService.getByCustomerId(customerId);
        setQuotations(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Báo Giá Thiết Kế Website Của Bạn</h1>
        <p className="text-xs text-slate-500 mt-1">Các bảng dự toán chi phí và điều khoản gửi đến quý khách</p>
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="w-8 h-8 text-slate-400" />}
          title="Không có báo giá nào"
          description="Hiện tại chưa có báo giá nào được gửi cho tài khoản của bạn."
        />
      ) : (
        <div className="space-y-4">
          {quotations.map((quote) => (
            <div
              key={quote.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-600 text-sm">{quote.quotationCode}</span>
                    <QuotationStatusBadge status={quote.status} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800 mt-1">{quote.title}</h2>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Hiệu lực đến: <strong className="text-slate-700">{formatDate(quote.validUntil)}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-brand-600">{formatCurrency(quote.total)}</div>
                  {quote.discount > 0 && (
                    <div className="text-xs text-slate-400">Đã giảm trừ: {formatCurrency(quote.discount)}</div>
                  )}
                </div>
              </div>

              {/* Items list */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Bảng chi tiết hạng mục
                </span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {quote.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between bg-slate-50/50">
                      <div>
                        <span className="font-medium text-slate-800">{it.name}</span>
                        <span className="text-slate-400 text-[11px] block">SL: {it.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-800">{formatCurrency(it.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">Điều khoản dịch vụ:</span>
                <p className="whitespace-pre-line leading-relaxed text-[11px]">{quote.terms}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  to={`/admin/quotations/${quote.id}/print`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Tải PDF báo giá</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
