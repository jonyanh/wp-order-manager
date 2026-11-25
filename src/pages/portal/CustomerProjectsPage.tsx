import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { projectsService, tasksService } from '../../services/db';
import { Project, Task } from '../../types';
import { formatDate } from '../../lib/utils';
import { PriorityBadge } from '../../components/common/Badge';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerProjectsPage: React.FC = () => {
  const { customerId } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksMap, setTasksMap] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!customerId) return;
      try {
        setLoading(true);
        const pList = await projectsService.getByCustomerId(customerId);
        setProjects(pList);

        const tMap: Record<string, Task[]> = {};
        for (const p of pList) {
          // Strictly load ONLY tasks where visibleToCustomer is true
          const tList = await tasksService.getCustomerVisibleTasks(p.id);
          tMap[p.id] = tList;
        }
        setTasksMap(tMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tiến Độ Triển Khai Dự Án Website</h1>
        <p className="text-xs text-slate-500 mt-1">
          Lộ trình 11 giai đoạn thực hiện chuẩn WordPress và các đầu việc công khai
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8 text-slate-400" />}
          title="Chưa có dự án nào"
          description="Dự án của bạn sẽ xuất hiện ở đây ngay khi đơn hàng được duyệt triển khai."
        />
      ) : (
        <div className="space-y-8">
          {projects.map((proj) => {
            const currentStageObj = proj.stages.find((s) => s.id === proj.currentStage);
            const pTasks = tasksMap[proj.id] || [];

            return (
              <div
                key={proj.id}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
              >
                {/* Project Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        {proj.status === 'completed' ? 'Đã hoàn thành' : 'Đang triển khai'}
                      </span>
                      <span className="text-xs text-slate-400">Hạn hoàn thành: {formatDate(proj.deadline)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mt-1">{proj.projectName}</h2>
                    {proj.websiteUrl && (
                      <a
                        href={proj.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:text-brand-700 mt-0.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{proj.websiteUrl}</span>
                      </a>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500">Tiến độ tổng thể</span>
                    <div className="text-2xl font-bold text-brand-600">{proj.progress}%</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Đang ở: <strong>{currentStageObj?.name}</strong></span>
                    <span>{proj.stages.filter((s) => s.completed).length} / 11 giai đoạn</span>
                  </div>
                </div>

                {/* 11 Stages Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Lộ Trình 11 Giai Đoạn Tiêu Chuẩn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {proj.stages.map((stage) => (
                      <div
                        key={stage.id}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                          stage.completed
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : stage.id === proj.currentStage
                            ? 'bg-brand-50/50 border-brand-200 text-brand-950 ring-1 ring-brand-300'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {stage.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold flex items-center justify-between">
                            <span>{stage.name}</span>
                            {stage.completed && (
                              <span className="text-[10px] text-emerald-600 font-normal">Đã xong</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visible Tasks to Customer */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Checklist Công Việc Được Cập Nhật Cho Khách Hàng ({pTasks.length})
                  </h3>

                  {pTasks.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      Hiện tại chưa có đầu việc công việc nào được công khai.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                      {pTasks.map((t) => (
                        <div key={t.id} className="p-3.5 flex items-start justify-between gap-3 bg-slate-50/40">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <PriorityBadge priority={t.priority} />
                              {t.status === 'done' ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                                  Hoàn thành [✓]
                                </span>
                              ) : (
                                <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-semibold">
                                  Đang thực hiện
                                </span>
                              )}
                            </div>
                            <div className={`font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {t.title}
                            </div>
                            {t.description && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 shrink-0">
                            Hạn: {formatDate(t.deadline)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
