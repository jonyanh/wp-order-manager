import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, Plus, Search, Eye, Printer, CheckCircle, ExternalLink } from 'lucide-react';
import { handoversService, customersService, ordersService } from '../../services/db';
import { Handover, Customer, Order } from '../../types';
import { formatDate } from '../../lib/utils';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const HandoversPage: React.FC = () => {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [hList, cList] = await Promise.all([
        handoversService.getAll(),
        customersService.getAll(),
      ]);
      setHandovers(hList);
      const cMap: Record<string, Customer> = {};
      cList.forEach((c) => {
        cMap[c.id] = c;
      });
      setCustomers(cMap);
    } catch (err: any) {
      error(err.message || 'Lỗi tải danh sách bàn giao');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = handovers.filter((h) => {
    const cust = customers[h.customerId];
    return (
      h.websiteName.toLowerCase().includes(search.toLowerCase()) ||
      h.domain.toLowerCase().includes(search.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Bàn Giao & Nghiệm Thu</h1>
          <p className="text-xs text-slate-500 mt-1">
            Biên bản bàn giao website WordPress, tài liệu hướng dẫn và điều khoản bảo hành
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm website, domain..."
        isFiltered={Boolean(search)}
        onResetFilters={() => setSearch('')}
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="w-8 h-8 text-slate-400" />}
          title="Chưa có biên bản bàn giao nào"
          description="Biên bản bàn giao được lập khi dự án thiết kế website hoàn tất các hạng mục kiểm tra."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Tên Website & Domain</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Ngày bàn giao</th>
                  <th className="py-3 px-4">Thời gian bảo hành</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Biên bản</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const cust = customers[item.customerId];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.websiteName}</div>
                        <a
                          href={item.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{item.domain}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cust?.name || 'Khách hàng'}</div>
                        <div className="text-[11px] text-slate-400">{cust?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{formatDate(item.handoverDate)}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{item.warrantyPeriod}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{item.status === 'accepted' ? 'Đã nghiệm thu' : 'Đã bàn giao'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/handovers/${item.id}/print`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="In biên bản nghiệm thu"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/handovers/${item.id}`}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
