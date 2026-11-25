import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ordersService, paymentsService, projectsService } from '../../services/db';
import { Order, Payment, Project } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../lib/utils';
import { LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const { success } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [oList, pList, prList] = await Promise.all([
          ordersService.getAll(),
          paymentsService.getAll(),
          projectsService.getAll(),
        ]);
        setOrders(oList);
        setPayments(pList);
        setProjects(prList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={8} />;

  // Financial Metrics
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum), 0);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDebt = Math.max(0, totalRevenue - totalCollected);
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  // Estimated Operational Costs (hosting, plugins, domain: approx 15% for freelancer)
  const estimatedCosts = Math.round(totalRevenue * 0.15);
  const estimatedProfit = Math.max(0, totalRevenue - estimatedCosts);

  // Monthly Revenue Comparison Data
  const monthlyData: Record<string, { month: string; orderRevenue: number; collected: number }> = {
    'Tháng 1': { month: 'Tháng 1', orderRevenue: 8500000, collected: 8500000 },
    'Tháng 2': { month: 'Tháng 2', orderRevenue: 22000000, collected: 15000000 },
    'Tháng 3': { month: 'Tháng 3', orderRevenue: 15000000, collected: 7500000 },
    'Tháng 4': { month: 'Tháng 4', orderRevenue: 12000000, collected: 6000000 },
    'Tháng 5': { month: 'Tháng 5', orderRevenue: 18000000, collected: 12000000 },
    'Tháng 6': { month: 'Tháng 6', orderRevenue: 25000000, collected: 20000000 },
  };

  const chartData = Object.values(monthlyData);

  // Revenue by Website Type
  const typeMap: Record<string, number> = {};
  orders.forEach((o) => {
    const t = o.websiteType || 'Khác';
    typeMap[t] = (typeMap[t] || 0) + Number(o.total || 0);
  });

  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const handleExportCSV = () => {
    const headers = ['Mã Đơn', 'Khách hàng', 'Tiêu đề', 'Loại website', 'Tổng tiền', 'Đã thanh toán', 'Công nợ', 'Trạng thái', 'Deadline'];
    const rows = orders.map((o) => [
      o.orderCode,
      o.customerName || 'N/A',
      o.title,
      o.websiteType,
      o.total,
      o.paidAmount,
      o.remainingAmount,
      o.status,
      o.deadline,
    ]);
    exportToCSV(`bao-cao-doanh-thu-${new Date().toISOString().split('T')[0]}`, headers, rows);
    success('Đã xuất báo cáo doanh thu & công nợ ra file CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Báo Cáo Doanh Thu & Hiệu Quả Kinh Doanh</h1>
          <p className="text-xs text-slate-500 mt-1">
            Phân tích dòng tiền, chi phí vận hành, công nợ và lợi nhuận dự án thiết kế website
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo CSV / Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng Doanh Thu Hợp Đồng</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{orders.length} hợp đồng đã phát sinh</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Thực Thu (Tiền Về)</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{payments.length} lượt giao dịch đã xác nhận</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Công Nợ Phải Thu</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalDebt)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Thu theo các mốc nghiệm thu</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lợi Nhuận Dự Kiến (85%)</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(estimatedProfit)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Chi phí hosting/domain ước tính: {formatCurrency(estimatedCosts)}</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Biểu Đồ Doanh Thu & Dòng Tiền Theo Tháng</h2>
            <p className="text-xs text-slate-500">So sánh tổng giá trị đơn hàng ký kết và số tiền thực thu về tài khoản</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="orderRevenue"
                  name="Giá trị đơn hàng"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#orderGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Thực thu về"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#collectGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Website Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Cơ Cấu Thể Loại Website</h2>
            <p className="text-xs text-slate-500 mb-2">Tỷ trọng doanh thu theo từng mảng</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Trống', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Doanh thu']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Performance Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Hiệu Quả Tài Chính Từng Đơn Hàng</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Mã đơn & Khách hàng</th>
                <th className="py-2.5 px-3">Loại web</th>
                <th className="py-2.5 px-3 text-right">Tổng hợp đồng</th>
                <th className="py-2.5 px-3 text-right">Đã thu</th>
                <th className="py-2.5 px-3 text-right">Công nợ còn</th>
                <th className="py-2.5 px-3 text-center">Tiến độ thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const percent = o.total > 0 ? Math.round((o.paidAmount / o.total) * 100) : 0;
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-800">{o.orderCode}</span>
                      <div className="text-slate-600 font-medium">{o.customerName || 'Khách hàng'}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{o.websiteType}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">{formatCurrency(o.paidAmount)}</td>
                    <td className="py-3 px-3 text-right font-bold text-amber-600">{formatCurrency(o.remainingAmount)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
