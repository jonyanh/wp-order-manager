import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { projectsService, customersService } from '../../services/db';
import { Project, Customer } from '../../types';
import { formatDate } from '../../lib/utils';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, cList] = await Promise.all([
        projectsService.getAll(),
        customersService.getAll(),
      ]);
      setProjects(pList);
      const cMap: Record<string, Customer> = {};
      cList.forEach((c) => {
        cMap[c.id] = c;
      });
      setCustomers(cMap);
    } catch (err: any) {
      error(err.message || 'Lỗi tải dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = projects.filter((p) => {
    const cust = customers[p.customerId];
    const matchSearch =
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      (p.websiteUrl && p.websiteUrl.toLowerCase().includes(search.toLowerCase())) ||
      (cust && cust.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Dự Án Thiết Kế WordPress</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi lộ trình 11 giai đoạn tiêu chuẩn từ tiếp nhận đến bàn giao website
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm dự án website..."
        isFiltered={Boolean(search || statusFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_progress">Đang triển khai</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="review">Đang nghiệm thu</option>
            <option value="paused">Tạm dừng</option>
          </select>
        }
      />

      {/* Projects Grid */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy dự án nào"
          description="Dự án được tự động khởi tạo khi xác nhận đơn hàng hoặc tạo trực tiếp trong chi tiết đơn hàng."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => {
            const customer = customers[proj.customerId];
            const currentStageObj = proj.stages.find((s) => s.id === proj.currentStage);

            return (
              <div
                key={proj.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 line-clamp-1">{proj.projectName}</h2>
                      <div className="text-xs text-slate-500 mt-0.5">Khách: {customer?.name || 'Khách hàng'}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        proj.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}
                    >
                      {proj.status === 'completed' ? 'Hoàn thành' : 'Đang làm'}
                    </span>
                  </div>

                  {proj.websiteUrl && (
                    <a
                      href={proj.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-mono"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{proj.websiteUrl}</span>
                    </a>
                  )}

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">
                        Giai đoạn {proj.currentStage}/11: {currentStageObj?.name || 'Triển khai'}
                      </span>
                      <span className="font-bold text-brand-600">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Hạn bàn giao: <strong>{formatDate(proj.deadline)}</strong></span>
                    <span>Bắt đầu: {formatDate(proj.startDate)}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">11 Giai đoạn chuẩn WP</span>
                  <Link
                    to={`/admin/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <span>Chi tiết tiến độ</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
