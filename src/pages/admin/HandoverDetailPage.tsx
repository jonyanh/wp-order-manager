import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle2, ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import { handoversService, customersService } from '../../services/db';
import { Handover, Customer } from '../../types';
import { formatDate } from '../../lib/utils';
import { LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const HandoverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [handover, setHandover] = useState<Handover | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const { success, error } = useToast();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const h = await handoversService.getAll().then((list) => list.find((x) => x.id === id) || null);
      if (!h) return;
      setHandover(h);

      const c = await customersService.getById(h.customerId);
      setCustomer(c);
    } catch (err: any) {
      error(err.message || 'Lỗi tải biên bản bàn giao');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={6} />;

  if (!handover) {
    return <div className="text-center py-12">Không tìm thấy biên bản bàn giao</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/handovers"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{handover.websiteName}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã nghiệm thu & Bàn giao
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khách hàng: <strong>{customer?.name}</strong> • Ngày bàn giao: {formatDate(handover.handoverDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/admin/handovers/${handover.id}/print`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>In Biên Bản Nghiệm Thu</span>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h2 className="font-bold text-slate-400 uppercase tracking-wider">Thông Tin Trang Web</h2>
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-400">Tên miền: </span>
              <a
                href={handover.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-bold text-brand-600 hover:underline"
              >
                {handover.domain}
              </a>
            </div>
            <div>
              <span className="text-slate-400">Khách hàng: </span>
              <span className="font-semibold text-slate-800">{customer?.name} ({customer?.phone})</span>
            </div>
            {handover.manualDocUrl && (
              <div className="pt-2">
                <a
                  href={handover.manualDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  <span>Tài liệu & Video hướng dẫn quản trị</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h2 className="font-bold text-slate-400 uppercase tracking-wider">Chính Sách Bảo Hành</h2>
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-400">Thời gian bảo hành: </span>
              <span className="font-bold text-emerald-600">{handover.warrantyPeriod}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">
              {handover.warrantyTerms}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Danh Mục Các Hạng Mục Bàn Giao</h2>
        <div className="divide-y divide-slate-100 text-xs">
          {handover.checklist.map((item, idx) => (
            <div key={idx} className="py-3 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800">{item.title}</div>
                {item.description && <div className="text-slate-500 text-[11px] mt-0.5">{item.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
