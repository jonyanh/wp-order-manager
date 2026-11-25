import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  ShoppingBag,
  CreditCard,
  LifeBuoy,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ordersService,
  projectsService,
  paymentsService,
  tasksService,
  supportRequestsService,
  customersService,
} from '../../services/db';
import { Order, Project, Payment, Task, SupportRequest, Customer } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { OrderStatusBadge, PriorityBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerDashboardPage: React.FC = () => {
  const { customerId, currentUser } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      if (!customerId) return;
      try {
        setLoading(true);
        const [c, oList, pList, payList, sList] = await Promise.all([
          customersService.getById(customerId),
          ordersService.getByCustomerId(customerId),
          projectsService.getByCustomerId(customerId),
          paymentsService.getByCustomerId(customerId),
          supportRequestsService.getByCustomerId(customerId),
        ]);

        setCustomer(c);
        setOrders(oList);
        setProjects(pList);
        setPayments(payList);
        setSupportRequests(sList);

        // Load visible tasks across client projects
        if (pList.length > 0) {
          const allTasks = await Promise.all(
            pList.map((proj) => tasksService.getCustomerVisibleTasks(proj.id))
          );
          setVisibleTasks(allTasks.flat());
        }
      } catch (err) {
        console.error('Customer dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [customerId]);

  if (loading) return <LoadingSkeleton rows={7} />;

  // Financial summary for this specific customer
  const totalValue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalRemaining = Math.max(0, totalValue - totalPaid);

  const activeProject = projects.find((p) => p.status !== 'completed') || projects[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-brand-500/15">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-brand-200 font-semibold">CỔNG THÔNG TIN KHÁCH HÀNG</span>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Xin chào, {customer?.name || currentUser?.name}!
          </h1>
          <p className="text-brand-100 text-xs sm:text-sm mt-2 leading-relaxed">
            Theo dõi tiến độ thiết kế website, danh sách đơn hàng, lịch sử thanh toán minh bạch và gửi yêu cầu chỉnh sửa cho kỹ thuật viên.
          </p>
        </div>
      </div>

      {/* KPI Cards Row (Specific to this client only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Giá Trị Dịch Vụ</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalValue)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{orders.length} đơn hàng đã đăng ký</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số Tiền Đã Thanh Toán</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Xác thực qua {payments.length} lượt giao dịch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số Tiền Còn Lại</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalRemaining)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Thanh toán khi nghiệm thu bàn giao</span>
        </div>
      </div>

      {/* Active Project Highlight */}
      {activeProject && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">DỰ ÁN ĐANG TRIỂN KHAI</span>
              <h2 className="text-lg font-bold text-slate-800 mt-0.5">{activeProject.projectName}</h2>
              {activeProject.websiteUrl && (
                <a
                  href={activeProject.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-mono mt-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{activeProject.websiteUrl}</span>
                </a>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800">
                Giai đoạn {activeProject.currentStage}/11: {activeProject.stages.find((s) => s.id === activeProject.currentStage)?.name}
              </span>
              <div className="text-xs text-slate-400 mt-0.5">
                Hạn bàn giao: <strong className="text-slate-700">{formatDate(activeProject.deadline)}</strong>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Tiến độ thực hiện</span>
              <span className="text-brand-600">{activeProject.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${activeProject.progress}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to="/portal/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              <span>Xem chi tiết 11 giai đoạn & công việc</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Section: Recent Orders & Tasks Visible to Customer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client's Orders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Đơn Hàng Của Bạn ({orders.length})</h2>
            <Link to="/portal/orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Xem tất cả
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map((o) => (
              <div key={o.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-800 text-xs">{o.orderCode}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 line-clamp-1">{o.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Hạn hoàn thành: {formatDate(o.deadline)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">{formatCurrency(o.total)}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Đã trả: {formatCurrency(o.paidAmount)}</div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Chưa có đơn hàng nào.</div>
            )}
          </div>
        </div>

        {/* Client's Tasks (Only visibleToCustomer) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Tiến Độ Công Việc Đang Làm</h2>
            <Link to="/portal/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Chi tiết
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {visibleTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <PriorityBadge priority={t.priority} />
                    {t.status === 'done' ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Đã hoàn thành
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        Đang xử lý
                      </span>
                    )}
                  </div>
                  <div className={`font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</div>
                  )}
                </div>
                <div className="text-slate-400 text-[11px] whitespace-nowrap shrink-0">
                  Hạn: {formatDate(t.deadline)}
                </div>
              </div>
            ))}
            {visibleTasks.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Không có công việc nào cần hiển thị.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
