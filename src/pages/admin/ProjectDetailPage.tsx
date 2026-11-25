import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar,
  CheckSquare,
  Plus,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { projectsService, ordersService, customersService, tasksService } from '../../services/db';
import { Project, Order, Customer, Task, ProjectStage } from '../../types';
import { formatDate } from '../../lib/utils';
import { PriorityBadge, TaskStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // New task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as any,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    visibleToCustomer: true,
  });

  const { success, error } = useToast();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const proj = await projectsService.getById(id);
      if (!proj) return;
      setProject(proj);

      const [o, c, tList] = await Promise.all([
        ordersService.getById(proj.orderId),
        customersService.getById(proj.customerId),
        tasksService.getByProjectId(proj.id),
      ]);
      setOrder(o);
      setCustomer(c);
      setTasks(tList);
    } catch (err: any) {
      error(err.message || 'Lỗi tải dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleStage = async (stage: ProjectStage) => {
    if (!project) return;
    try {
      const updated = await projectsService.updateStage(project.id, stage.id, !stage.completed);
      setProject(updated);
      success(`Đã cập nhật trạng thái giai đoạn: ${stage.name}`);
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !taskForm.title.trim()) return;

    try {
      await tasksService.create({
        projectId: project.id,
        orderId: project.orderId,
        title: taskForm.title,
        description: taskForm.description,
        status: 'todo',
        priority: taskForm.priority,
        deadline: taskForm.deadline,
        visibleToCustomer: taskForm.visibleToCustomer,
      });

      success('Đã thêm công việc mới');
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visibleToCustomer: true,
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi thêm task');
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await tasksService.update(task.id, { status: nextStatus });
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật task');
    }
  };

  const handleToggleTaskVisibility = async (task: Task) => {
    try {
      await tasksService.update(task.id, { visibleToCustomer: !task.visibleToCustomer });
      success(
        !task.visibleToCustomer
          ? 'Công việc đã được bật hiển thị trên Customer Portal'
          : 'Công việc đã được ẩn khỏi Customer Portal'
      );
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật quyền xem');
    }
  };

  if (loading) return <LoadingSkeleton rows={8} />;

  if (!project) {
    return <div className="text-center py-12">Không tìm thấy dự án</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/projects"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{project.projectName}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-brand-50 text-brand-700">
                Tiến độ: {project.progress}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khách hàng: <strong>{customer?.name}</strong> • Hạn hoàn thành: {formatDate(project.deadline)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Xem Website Demo</span>
            </a>
          )}
          {order && (
            <Link
              to={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-xl transition"
            >
              <span>Xem đơn hàng ({order.orderCode})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Progress Bar Big */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800">
            Tổng Quan Tiến Độ (Giai đoạn {project.currentStage}/11 hoàn tất)
          </span>
          <span className="text-sm font-bold text-brand-600">{project.progress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Two Column Layout: Stages & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 11 Standard WordPress Stages */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Lộ Trình 11 Giai Đoạn WordPress</h2>
              <p className="text-xs text-slate-500">Tích chọn để cập nhật tiến độ tự động</p>
            </div>
            <span className="text-xs font-semibold text-brand-600">
              {project.stages.filter((s) => s.completed).length} / 11 đã xong
            </span>
          </div>

          <div className="space-y-3">
            {project.stages.map((stage) => (
              <div
                key={stage.id}
                onClick={() => handleToggleStage(stage)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                  stage.completed
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {stage.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold ${stage.completed ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                      {stage.name}
                    </span>
                    {stage.completedAt && (
                      <span className="text-[10px] text-emerald-600 font-medium shrink-0">
                        Xong: {formatDate(stage.completedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Project Tasks Checklist */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Công Việc (Tasks)</h2>
                <p className="text-xs text-slate-500">Checklist nhiệm vụ cụ thể</p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition"
                title="Thêm công việc"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5"
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => handleToggleTaskStatus(task)}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <PriorityBadge priority={task.priority} />
                      <button
                        type="button"
                        onClick={() => handleToggleTaskVisibility(task)}
                        title={task.visibleToCustomer ? 'Đang công khai với khách' : 'Đang ẩn nội bộ'}
                        className={`p-0.5 rounded ${
                          task.visibleToCustomer ? 'text-brand-600' : 'text-slate-400'
                        }`}
                      >
                        {task.visibleToCustomer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className={`font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Hạn: {formatDate(task.deadline)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">Chưa có công việc nào. Bấm (+) để thêm.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Thêm Công Việc Mới Cho Dự Án"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="VD: Cấu hình cổng thanh toán VNPay Sandbox"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Ưu tiên cao</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn hoàn thành</label>
              <input
                type="date"
                required
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chi tiết</label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Yêu cầu chi tiết cần hoàn thành..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="custVisible"
              checked={taskForm.visibleToCustomer}
              onChange={(e) => setTaskForm({ ...taskForm, visibleToCustomer: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="custVisible" className="text-xs font-medium text-slate-700">
              Hiển thị công việc này trên Customer Portal để khách hàng theo dõi
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
            >
              Lưu công việc
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
