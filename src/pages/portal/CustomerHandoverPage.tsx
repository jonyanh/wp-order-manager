import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, Printer, CheckCircle2, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { handoversService } from '../../services/db';
import { Handover } from '../../types';
import { formatDate } from '../../lib/utils';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerHandoverPage: React.FC = () => {
  const { customerId } = useAuth();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!customerId) return;
      try {
        setLoading(true);
        const list = await handoversService.getAll();
        const clientHandovers = list.filter((h) => h.customerId === customerId);
        setHandovers(clientHandovers);
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
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tài Liệu Bàn Giao & Bảo Hành Website</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hồ sơ nghiệm thu, tài liệu hướng dẫn quản trị WordPress và chính sách bảo hành chính thức
        </p>
      </div>

      {handovers.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="w-8 h-8 text-slate-400" />}
          title="Chưa có biên bản bàn giao"
          description="Biên bản bàn giao và tài liệu hướng dẫn sẽ hiển thị tại đây khi website của bạn hoàn thiện nghiệm thu."
        />
      ) : (
        <div className="space-y-6">
          {handovers.map((h) => (
            <div
              key={h.id}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đã Bàn Giao Nghiệm Thu
                    </span>
                    <span className="text-xs text-slate-400">Ngày bàn giao: {formatDate(h.handoverDate)}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mt-1">{h.websiteName}</h2>
                  <a
                    href={h.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:text-brand-700 mt-0.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{h.domain}</span>
                  </a>
                </div>

                <Link
                  to={`/admin/handovers/${h.id}/print`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-xl transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Biên Bản Nghiệm Thu (PDF)</span>
                </Link>
              </div>

              {/* Warranty and Docs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block">
                    CHÍNH SÁCH BẢO HÀNH KỸ THUẬT
                  </span>
                  <div>
                    Thời gian: <strong className="text-emerald-700">{h.warrantyPeriod}</strong>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">
                    {h.warrantyTerms}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block">
                    TÀI LIỆU HƯỚNG DẪN QUẢN TRỊ
                  </span>
                  {h.manualDocUrl && (
                    <a
                      href={h.manualDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-brand-600 hover:underline font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Truy cập Video & Tài liệu hướng dẫn sử dụng (Google Drive)</span>
                    </a>
                  )}
                  {h.manualNotes && (
                    <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
                      {h.manualNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Checklist items */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Danh Mục Hạng Mục Đã Kiểm Tra & Nghiệm Thu
                </span>
                <div className="space-y-2 text-xs">
                  {h.checklist.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800">{item.title}</div>
                        {item.description && (
                          <div className="text-slate-500 text-[11px] mt-0.5">{item.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
