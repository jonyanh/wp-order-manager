import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { tasksService, projectsService } from '../../services/db';
import { Task, Project, TaskStatus, TaskPriority } from '../../types';
import { formatDate } from '../../lib/utils';
import { PriorityBadge, TaskStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    visibleToCustomer: true,
  });

  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, pList] = await Promise.all([tasksService.getAll(), projectsService.getAll()]);
      setTasks(tList);
      setProjects(pList);
      if (pList.length > 0 && !taskForm.projectId) {
        setTaskForm((prev) => ({ ...prev, projectId: pList[0].id }));
      }
    } catch (err: any) {
      error(err.message || 'Lỗi tải công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await tasksService.update(task.id, { status: nextStatus });
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleToggleVisibility = async (task: Task) => {
    try {
      await tasksService.update(task.id, { visibleToCustomer: !task.visibleToCustomer });
      success(
        !task.visibleToCustomer
          ? 'Công việc đã được bật hiển thị trên Customer Portal'
          : 'Công việc đã được ẩn khỏi Customer Portal'
      );
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.projectId) {
      error('Vui lòng chọn dự án');
      return;
    }
    if (!taskForm.title.trim()) {
      error('Vui lòng nhập tiêu đề');
      return;
    }

    const selectedProj = projects.find((p) => p.id === taskForm.projectId);
    try {
      await tasksService.create({
        projectId: taskForm.projectId,
        orderId: selectedProj?.orderId || '',
        title: taskForm.title,
        description: taskForm.description,
        status: 'todo',
        priority: taskForm.priority,
        deadline: taskForm.deadline,
        visibleToCustomer: taskForm.visibleToCustomer,
      });

      success('Đã thêm công việc thành công');
      setIsModalOpen(false);
      setTaskForm({
        projectId: projects[0]?.id || '',
        title: '',
        description: '',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visibleToCustomer: true,
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi tạo task');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await tasksService.delete(deleteId);
      success('Đã xóa công việc');
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Không thể xóa');
    }
  };

  const filtered = tasks.filter((t) => {
    const proj = projects.find((p) => p.id === t.projectId);
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (proj && proj.projectName.toLowerCase().includes(search.toLowerCase()));

    const matchProj = projectFilter === 'all' || t.projectId === projectFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchSearch && matchProj && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Quản Lý Công Việc & Nhiệm Vụ</h1>
          <p className="text-xs text-slate-500 mt-1">
            Checklist các hạng mục WordPress và phân quyền hiển thị công việc cho khách hàng
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm công việc</span>
        </button>
      </div>

      {/* Filter and search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm công việc..."
        isFiltered={Boolean(search || projectFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setProjectFilter('all');
          setStatusFilter('all');
          setPriorityFilter('all');
        }}
        filters={
          <>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả dự án</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="todo">Cần làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Đã hoàn thành</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả ưu tiên</option>
              <option value="high">Ưu tiên cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </>
        }
      />

      {/* Tasks Table */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-slate-400" />}
          title="Không tìm thấy công việc nào"
          description="Bấm 'Thêm công việc' để tạo nhiệm vụ checklist cho dự án."
          action={{ label: 'Thêm công việc', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">Xong</th>
                  <th className="py-3 px-4">Công việc & Dự án</th>
                  <th className="py-3 px-4">Ưu tiên</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Hiển thị portal</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const proj = projects.find((p) => p.id === t.projectId);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t)}
                          className="text-slate-400 hover:text-brand-600 transition"
                        >
                          {t.status === 'done' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</div>
                        )}
                        <span className="text-[10px] text-brand-600 font-medium block mt-0.5">
                          {proj?.projectName || 'Dự án'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <TaskStatusBadge status={t.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(t)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            t.visibleToCustomer
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {t.visibleToCustomer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{t.visibleToCustomer ? 'Khách thấy' : 'Ẩn nội bộ'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(t.deadline)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteId(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm Công Việc Mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dự án website <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={taskForm.projectId}
              onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="VD: Nhập dữ liệu 10 bài viết mẫu chuẩn SEO"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả công việc</label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="tVisible"
              checked={taskForm.visibleToCustomer}
              onChange={(e) => setTaskForm({ ...taskForm, visibleToCustomer: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="tVisible" className="text-xs font-medium text-slate-700">
              Cho phép khách hàng nhìn thấy công việc này trên Customer Portal
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa công việc này?"
        message="Hành động này sẽ xóa công việc khỏi danh sách checklist."
      />
    </div>
  );
};
