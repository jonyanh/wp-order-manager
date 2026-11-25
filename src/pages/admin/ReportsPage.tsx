import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
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
import { LoadingSkeleton, EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { useToast } from '../../context/ToastContext';

type TimeRange = 'last6' | 'thisYear' | 'all';

export const ReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Orders Performance Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('last6');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const { success, error } = useToast();

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
      } catch (err: any) {
        console.error(err);
        error('Lỗi khi tải dữ liệu báo cáo: ' + (err?.message || 'Không xác định'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter valid non-cancelled orders for overall revenue calculations
  const validOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  // Financial Metrics (Calculated dynamically and reconciled)
  const totalRevenue = useMemo(
    () => validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    [validOrders]
  );

  // Total collected: Reconcile payments and order paidAmount
  const totalCollected = useMemo(() => {
    const paymentsSum = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const ordersPaidSum = validOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
    // Take paymentsSum if recorded, or fallback to direct orders paidAmount
    return Math.max(paymentsSum, ordersPaidSum);
  }, [payments, validOrders]);

  // Total debt remaining on active orders
  const totalDebt = useMemo(() => {
    return validOrders.reduce((sum, o) => {
      const remaining = o.remainingAmount != null ? Number(o.remainingAmount) : Math.max(0, Number(o.total || 0) - Number(o.paidAmount || 0));
      return sum + remaining;
    }, 0);
  }, [validOrders]);

  // Collection Rate
  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

  // Estimated Operational Costs (hosting, plugins, domain: approx 15% for freelancer)
  const estimatedCosts = Math.round(totalRevenue * 0.15);
  const estimatedProfit = Math.max(0, totalCollected - Math.round(totalCollected * 0.15));
  const estimatedContractProfit = Math.max(0, totalRevenue - estimatedCosts);

  // Completed projects count
  const completedProjectsCount = projects.filter((p) => p.status === 'completed').length;

  // Dynamic Monthly Chart Calculation based on real orders & payments
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Determine the list of month keys (YYYY-MM)
    const monthKeys: string[] = [];

    if (timeRange === 'last6') {
      // Last 6 months up to current month
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthKeys.push(`${y}-${m}`);
      }
    } else if (timeRange === 'thisYear') {
      // 12 months of current year
      for (let m = 1; m <= 12; m++) {
        monthKeys.push(`${currentYear}-${String(m).padStart(2, '0')}`);
      }
    } else {
      // All months with activity
      const allDates: string[] = [];
      validOrders.forEach((o) => {
        if (o.startDate) allDates.push(o.startDate.slice(0, 7));
        else if (o.createdAt) allDates.push(o.createdAt.slice(0, 7));
      });
      payments.forEach((p) => {
        if (p.paymentDate) allDates.push(p.paymentDate.slice(0, 7));
        else if (p.createdAt) allDates.push(p.createdAt.slice(0, 7));
      });

      const uniqueMonths = Array.from(new Set(allDates)).filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
      if (uniqueMonths.length === 0) {
        // Fallback to recent 6 months
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          monthKeys.push(`${y}-${m}`);
        }
      } else {
        monthKeys.push(...uniqueMonths);
      }
    }

    // Initialize mapping
    const map: Record<string, { month: string; orderRevenue: number; collected: number; orderCount: number }> = {};
    monthKeys.forEach((key) => {
      const [yearStr, monthStr] = key.split('-');
      const label = timeRange === 'thisYear' ? `Tháng ${parseInt(monthStr, 10)}` : `T${parseInt(monthStr, 10)}/${yearStr.slice(2)}`;
      map[key] = {
        month: label,
        orderRevenue: 0,
        collected: 0,
        orderCount: 0,
      };
    });

    // Populate order revenue from actual valid orders
    validOrders.forEach((o) => {
      const dateStr = o.startDate || o.createdAt || '';
      const key = dateStr.slice(0, 7);
      if (map[key]) {
        map[key].orderRevenue += Number(o.total || 0);
        map[key].orderCount += 1;
      }
    });

    // Populate collected revenue from payments
    if (payments.length > 0) {
      payments.forEach((p) => {
        const dateStr = p.paymentDate || p.createdAt || '';
        const key = dateStr.slice(0, 7);
        if (map[key]) {
          map[key].collected += Number(p.amount || 0);
        }
      });
    } else {
      // If no payments recorded in payments collection, attribute order paidAmount to the order's month
      validOrders.forEach((o) => {
        const dateStr = o.startDate || o.createdAt || '';
        const key = dateStr.slice(0, 7);
        if (map[key]) {
          map[key].collected += Number(o.paidAmount || 0);
        }
      });
    }

    return monthKeys.map((k) => map[k]);
  }, [validOrders, payments, timeRange]);

  // Revenue by Website Type (Pie Chart)
  const pieData = useMemo(() => {
    const typeMap: Record<string, { count: number; total: number }> = {};
    validOrders.forEach((o) => {
      const t = o.websiteType || 'Khác';
      if (!typeMap[t]) {
        typeMap[t] = { count: 0, total: 0 };
      }
      typeMap[t].count += 1;
      typeMap[t].total += Number(o.total || 0);
    });

    return Object.entries(typeMap).map(([name, data]) => ({
      name,
      value: data.total,
      count: data.count,
      percentage: totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0,
    }));
  }, [validOrders, totalRevenue]);

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  // Filtered Orders for the Performance Table
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderCode.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.title && o.title.toLowerCase().includes(q)) ||
        (o.websiteType && o.websiteType.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchType = typeFilter === 'all' || o.websiteType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  // Paginated Orders
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset filter handler
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  const isFiltered = searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã Đơn',
      'Khách hàng',
      'Tiêu đề',
      'Loại website',
      'Tổng tiền (VND)',
      'Đã thu (VND)',
      'Công nợ (VND)',
      'Tiến độ thu (%)',
      'Trạng thái',
      'Ngày bắt đầu',
      'Deadline',
    ];
    const rows = filteredOrders.map((o) => {
      const percent = o.total > 0 ? Math.round(((o.paidAmount || 0) / o.total) * 100) : 0;
      return [
        o.orderCode,
        o.customerName || 'N/A',
        o.title || '',
        o.websiteType || 'Khác',
        o.total || 0,
        o.paidAmount || 0,
        o.remainingAmount != null ? o.remainingAmount : Math.max(0, (o.total || 0) - (o.paidAmount || 0)),
        `${percent}%`,
        o.status,
        o.startDate || '',
        o.deadline || '',
      ];
    });
    exportToCSV(`bao-cao-doanh-thu-wp-order-${new Date().toISOString().split('T')[0]}`, headers, rows);
    success('Đã xuất báo cáo doanh thu & công nợ ra file CSV thành công!');
  };

  if (loading) return <LoadingSkeleton rows={8} />;

  // Status mapping for badge display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Hoàn thành</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">Đang triển khai</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Chờ duyệt / cọc</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Đã hủy</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Báo Cáo Doanh Thu & Hiệu Quả Kinh Doanh</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu thực tế từ các đơn hàng, phiếu thu, công nợ và chi phí vận hành
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Tổng doanh thu hợp đồng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tổng Doanh Thu Hợp Đồng</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2 font-mono">{formatCurrency(totalRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>{validOrders.length} hợp đồng hợp lệ ({orders.length} tổng số)</span>
          </div>
        </div>

        {/* Card 2: Thực thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Thực Thu (Tiền Về)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">{formatCurrency(totalCollected)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-700">{collectionRate}%</span>
            <span>đã thu trên tổng doanh thu</span>
          </div>
        </div>

        {/* Card 3: Công nợ phải thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Công Nợ Phải Thu</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2 font-mono">{formatCurrency(totalDebt)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{validOrders.filter((o) => (o.remainingAmount || (o.total - o.paidAmount)) > 0).length} đơn còn dư nợ cần thu</span>
          </div>
        </div>

        {/* Card 4: Lợi nhuận dự kiến */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Lợi Nhuận Ước Tính (~85%)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2 font-mono">{formatCurrency(estimatedContractProfit)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Ước tính trừ chi phí hosting/plugin ~15%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Biểu Đồ Doanh Thu & Dòng Tiền Theo Tháng</span>
              </h2>
              <p className="text-xs text-slate-500">
                Dữ liệu thực tế: Giá trị hợp đồng ký kết so với số tiền thực thu về
              </p>
            </div>

            {/* Time range selector pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setTimeRange('last6')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  timeRange === 'last6' ? 'bg-white text-brand-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Tháng gần nhất
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('thisYear')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  timeRange === 'thisYear' ? 'bg-white text-brand-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Năm nay (2026)
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  timeRange === 'all' ? 'bg-white text-brand-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                    return `${val}`;
                  }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    formatCurrency(Number(val)),
                    name === 'orderRevenue' ? 'Giá trị đơn hàng' : 'Thực thu về',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'orderRevenue' ? 'Giá trị đơn hàng' : 'Thực thu về')}
                />
                <Area
                  type="monotone"
                  dataKey="orderRevenue"
                  name="orderRevenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#orderGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="collected"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#collectGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Website Category Breakdown (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-brand-600" />
                <span>Cơ Cấu Thể Loại Website</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-2">Tỷ trọng doanh thu theo từng mảng dịch vụ</p>

            <div className="h-48 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
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
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">
                  Chưa có dữ liệu đơn hàng hợp lệ
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-3 border-t border-slate-100 max-h-40 overflow-y-auto pr-1">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center py-0.5">
                <span className="flex items-center gap-1.5 text-slate-600 truncate mr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({item.count} đơn)</span>
                </span>
                <span className="font-bold text-slate-800 shrink-0 font-mono">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Performance Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>Hiệu Quả Tài Chính Từng Đơn Hàng ({filteredOrders.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Chi tiết hợp đồng, số tiền đã thu, công nợ tồn đọng và tỷ lệ thanh toán của từng dự án
            </p>
          </div>
        </div>

        {/* Compact SearchBar */}
        <SearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Tìm mã đơn, khách hàng, tên web..."
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
          filters={
            <>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ cọc / Chờ duyệt</option>
                <option value="in_progress">Đang triển khai</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              {/* Website Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">Tất cả loại web</option>
                <option value="Bán hàng">Bán hàng / E-commerce</option>
                <option value="Doanh nghiệp">Doanh nghiệp</option>
                <option value="Landing page">Landing page</option>
                <option value="Bất động sản">Bất động sản</option>
                <option value="Tin tức">Tin tức / Blog</option>
                <option value="Khác">Khác</option>
              </select>
            </>
          }
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Mã đơn & Khách hàng</th>
                <th className="py-2.5 px-3">Loại web & Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Tổng hợp đồng</th>
                <th className="py-2.5 px-3 text-right">Đã thu</th>
                <th className="py-2.5 px-3 text-right">Công nợ còn lại</th>
                <th className="py-2.5 px-3 text-center">Tiến độ thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((o) => {
                  const remaining =
                    o.remainingAmount != null
                      ? Number(o.remainingAmount)
                      : Math.max(0, Number(o.total || 0) - Number(o.paidAmount || 0));
                  const percent = o.total > 0 ? Math.min(100, Math.round(((o.paidAmount || 0) / o.total) * 100)) : 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800">{o.orderCode}</div>
                        <div className="text-slate-600 font-medium">{o.customerName || 'Khách hàng'}</div>
                        {o.title && <div className="text-[11px] text-slate-400 truncate max-w-xs">{o.title}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-700">{o.websiteType || 'Khác'}</div>
                        <div className="mt-1">{getStatusBadge(o.status)}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 font-mono">
                        {formatCurrency(o.total || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(o.paidAmount || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono">
                        {remaining > 0 ? (
                          <span className="text-amber-600">{formatCurrency(remaining)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 ₫ (Hết nợ)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              percent >= 100
                                ? 'bg-emerald-100 text-emerald-700'
                                : percent > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {percent}%
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <EmptyState
                      title="Không tìm thấy đơn hàng nào"
                      description="Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Trang {currentPage} / {totalPages} (Tổng {filteredOrders.length} đơn)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg font-medium transition ${
                    currentPage === p
                      ? 'bg-brand-600 text-white font-bold'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
