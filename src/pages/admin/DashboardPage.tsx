import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Globe,
  Server,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  customersService,
  ordersService,
  paymentsService,
  tasksService,
  hostingDomainsService,
  quotationsService,
} from '../../services/db';
import { Customer, Order, Payment, Task, HostingDomain, Quotation } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { OrderStatusBadge, PriorityBadge, TaskStatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/EmptyState';
import { generateSystemAlerts, SystemAlert } from '../../lib/expirationAlerts';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hostingDomains, setHostingDomains] = useState<HostingDomain[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, oList, pList, tList, hdList, qList] = await Promise.all([
          customersService.getAll(),
          ordersService.getAll(),
          paymentsService.getAll(),
          tasksService.getAll(),
          hostingDomainsService.getAll(),
          quotationsService.getAll(),
        ]);
        setCustomers(cList);
        setOrders(oList);
        setPayments(pList);
        setTasks(tList);
        setHostingDomains(hdList);
        setQuotations(qList);

        const generated = generateSystemAlerts({
          hostingDomains: hdList,
          orders: oList,
          tasks: tList,
          quotations: qList,
        });
        setAlerts(generated);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={8} />;
  }

  // Key KPI Metrics Calculations
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === 'new' || o.status === 'pending_confirm').length;
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress' || o.status === 'deposited' || o.status === 'revising').length;
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'paid' || o.status === 'accepted').length;

  const now = new Date();
  const overdueOrders = orders.filter((o) => {
    if (o.status === 'completed' || o.status === 'cancelled') return false;
    const deadlineDate = new Date(o.deadline);
    return !isNaN(deadlineDate.getTime()) && deadlineDate < now;
  }).length;

  // Revenue & Debt calculations
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDebt = Math.max(0, totalRevenue - totalPaid);

  // Status breakdown for Pie Chart
  const statusCounts: Record<string, number> = {
    'Mới / Chờ duyệt': newOrders,
    'Đang triển khai': inProgressOrders,
    'Đã hoàn thành': completedOrders,
    'Quá hạn': overdueOrders,
  };

  const pieData = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  const PIE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f43f5e'];

  // Monthly Revenue Chart Data
  const monthlyRevenueMap: Record<string, number> = {};
  payments.forEach((p) => {
    const d = new Date(p.paymentDate);
    if (!isNaN(d.getTime())) {
      const key = `Tháng ${d.getMonth() + 1}`;
      monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + Number(p.amount);
    }
  });

  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'];
  const barChartData = months.map((m) => ({
    name: m,
    'Doanh thu': monthlyRevenueMap[m] || 0,
  }));

  // Upcoming Tasks
  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  // Recent Orders
  const recentOrders = orders.slice(0, 5);

  const urgentAlertsCount = alerts.filter((a) => a.severity === 'danger').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tổng Quan Hoạt Động WP Order Manager</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi dòng tiền, tiến độ dự án thiết kế website và các công việc sắp tới hạn.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/orders/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn hàng mới</span>
          </Link>
          <Link
            to="/admin/quotations/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <span>Lập báo giá</span>
          </Link>
        </div>
      </div>

      {/* Expiration & Deadline Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-200/90 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Lịch nhắc hạn: Có {alerts.length} mục cần chú ý (Sắp hết hạn / Quá hạn)
                </span>
                {urgentAlertsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                    {urgentAlertsCount} khẩn cấp
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Bao gồm tên miền/hosting sắp đến kỳ gia hạn hoặc đơn hàng/công việc sắp đến hạn bàn giao.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              to="/admin/hosting-domains"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-brand-600 text-xs font-semibold rounded-xl shadow-2xs transition"
            >
              <span>Xem tên miền & hosting</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Row 1: Financials */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Doanh Thu Đơn Hàng</span>
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              100%
            </span>
            <span>Doanh thu dự kiến</span>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Thực Thu (Đã Nhận)</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight font-mono">
            {formatCurrency(totalPaid)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}%
            </span>
            <span>Tỷ lệ thu tiền thực tế</span>
          </div>
        </div>

        {/* Remaining Debt */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Công Nợ Còn Lại</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight font-mono">
            {formatCurrency(totalDebt)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span className="text-amber-600 font-medium">Cần thu hồi các đợt tiếp</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Operational Volume */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Khách hàng</div>
            <div className="text-lg font-bold text-slate-800">{totalCustomers}</div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tổng đơn hàng</div>
            <div className="text-lg font-bold text-slate-800">{totalOrders}</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Đang triển khai</div>
            <div className="text-lg font-bold text-amber-600">{inProgressOrders}</div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Đã hoàn thành</div>
            <div className="text-lg font-bold text-emerald-600">{completedOrders}</div>
          </div>
        </div>
      </div>

      {/* Charts Section: Monthly Revenue & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Biểu Đồ Doanh Thu</h2>
              <p className="text-xs text-slate-500">Số tiền thu theo từng tháng gần nhất</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-slate-600 font-medium">Doanh thu thực tế (VNĐ)</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Doanh thu']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="Doanh thu" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Pie Chart (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Trạng Thái Đơn Hàng</h2>
            <p className="text-xs text-slate-500 mb-2">Tỷ trọng các giai đoạn hợp đồng</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Không có đơn', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [val, 'Đơn hàng']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Lists: Recent Orders & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Đơn Hàng Gần Đây</h2>
              <p className="text-xs text-slate-500">Các hợp đồng mới tiếp nhận & xử lý</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800 font-mono">{order.orderCode}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-slate-600 truncate font-medium">{order.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Khách: {order.customerName || 'Chưa gán'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-800">{formatCurrency(order.total)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Hạn: {formatDate(order.deadline)}</div>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Chưa có đơn hàng nào.</div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Công Việc Sắp Đến Hạn</h2>
              <p className="text-xs text-slate-500">Nhiệm vụ cần ưu tiên hoàn thành cho website</p>
            </div>
            <Link
              to="/admin/tasks"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Xem checklist <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{task.title}</div>
                  {task.description && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(task.deadline)}
                  </span>
                </div>
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Không có công việc nào tồn đọng!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
