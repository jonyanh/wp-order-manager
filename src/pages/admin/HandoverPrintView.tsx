import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { handoversService, customersService, settingsService } from '../../services/db';
import { Handover, Customer, AppSettings } from '../../types';
import { formatDate } from '../../lib/utils';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const HandoverPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [handover, setHandover] = useState<Handover | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [hList, s] = await Promise.all([handoversService.getAll(), settingsService.get()]);
        const h = hList.find((x) => x.id === id) || null;
        if (h) {
          setHandover(h);
          const c = await customersService.getById(h.customerId);
          setCustomer(c);
        }
        setSettings(s);
      } catch (err) {
        console.error('Error loading handover print:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={8} />;

  if (!handover) {
    return <div className="text-center py-12">Không tìm thấy biên bản bàn giao</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <Link
          to={`/admin/handovers/${handover.id}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Printer className="w-4 h-4" /> In Biên Bản Nghiệm Thu (PDF)
        </button>
      </div>

      {/* Printable Certificate */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print-card space-y-8">
        {/* Header */}
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
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              BIÊN BẢN NGHIỆM THU & BÀN GIAO WEBSITE
            </span>
            <div className="text-xs text-slate-400 mt-1">Ngày lập: {formatDate(handover.handoverDate)}</div>
          </div>
        </div>

        {/* Both Parties */}
        <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              BÊN BÀN GIAO (BÊN A)
            </span>
            <div className="font-bold text-slate-900">{settings?.companyName || 'WP Studio Vietnam'}</div>
            <div className="text-slate-600 mt-0.5">Đại diện: {settings?.bankHolder || 'Freelancer'}</div>
            <div className="text-slate-600">SĐT: {settings?.phone || '0988 123 456'}</div>
          </div>

          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              BÊN TIẾP NHẬN (BÊN B)
            </span>
            <div className="font-bold text-slate-900">{customer?.name}</div>
            <div className="text-slate-600 mt-0.5">SĐT: {customer?.phone} • Email: {customer?.email || 'N/A'}</div>
            {customer?.company && <div className="text-slate-600">Đơn vị: {customer.company}</div>}
          </div>
        </div>

        {/* Website particulars */}
        <div className="text-xs space-y-1">
          <div className="font-bold text-slate-900 text-sm">Hạng mục nghiệm thu bàn giao:</div>
          <div>Tên website: <strong>{handover.websiteName}</strong></div>
          <div>Tên miền chính thức: <strong className="font-mono">{handover.domain}</strong></div>
          <div>Đường dẫn URL: <strong className="font-mono">{handover.websiteUrl}</strong></div>
        </div>

        {/* Checklist */}
        <div>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-700">
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3">Nội dung hạng mục bàn giao</th>
                <th className="py-2.5 px-3 text-center w-28">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {handover.checklist.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    {item.description && <div className="text-slate-500 text-[11px]">{item.description}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600">Đạt yêu cầu [✓]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Warranty terms */}
        <div className="pt-4 border-t border-slate-200 text-xs">
          <span className="font-bold text-slate-800 block mb-1">
            Chính sách bảo hành ({handover.warrantyPeriod}):
          </span>
          <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">{handover.warrantyTerms}</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-10 text-center text-xs">
          <div>
            <div className="font-bold text-slate-800 uppercase">ĐẠI DIỆN BÊN B (KHÁCH HÀNG)</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký và xác nhận đã nhận bàn giao)</div>
            <div className="h-20"></div>
            <div className="font-semibold text-slate-800">{customer?.name}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 uppercase">ĐẠI DIỆN BÊN A (ĐƠN VỊ THIẾT KẾ)</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký và đóng dấu nếu có)</div>
            <div className="h-20"></div>
            <div className="font-semibold text-slate-800">{settings?.bankHolder || 'WP Studio'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
