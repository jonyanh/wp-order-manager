import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  FileSpreadsheet,
  FolderKanban,
  CreditCard,
  LifeBuoy,
  FileCheck2,
  ExternalLink,
  LogOut,
  Building2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { customersService } from '../../services/db';

export const CustomerLayout: React.FC = () => {
  const { currentUser, customerId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [customerInfo, setCustomerInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (customerId) {
      customersService.getById(customerId).then(setCustomerInfo);
    }
  }, [customerId]);

  const navItems = [
    { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/portal/orders', icon: ShoppingBag, label: 'Đơn hàng của tôi' },
    { to: '/portal/quotations', icon: FileSpreadsheet, label: 'Báo giá' },
    { to: '/portal/projects', icon: FolderKanban, label: 'Tiến độ dự án & Task' },
    { to: '/portal/payments', icon: CreditCard, label: 'Lịch sử thanh toán' },
    { to: '/portal/support', icon: LifeBuoy, label: 'Gửi yêu cầu hỗ trợ' },
    { to: '/portal/handover', icon: FileCheck2, label: 'Tài liệu bàn giao' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar with Client Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-bold text-lg">
              WP
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm tracking-tight block">Khu Vực Khách Hàng</span>
              <span className="text-[10px] text-slate-500 font-medium">Cổng theo dõi dự án & đơn hàng trực tuyến</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick back to Admin */}
            <button
              onClick={() => {
                navigate('/admin/dashboard');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Về Trang Quản Trị Admin</span>
            </button>

            {/* Customer Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.charAt(0) || 'K'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-800">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  {customerInfo?.company || customerInfo?.phone || 'Khách hàng đối tác'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center text-xs text-slate-500">
          Hệ thống theo dõi & bàn giao website WP Order Manager • Hotline hỗ trợ: 0988 123 456
        </div>
      </footer>
    </div>
  );
};
