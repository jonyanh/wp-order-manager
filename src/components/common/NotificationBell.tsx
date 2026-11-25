import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Globe,
  Server,
  ShieldAlert,
  Clock,
  CheckSquare,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  hostingDomainsService,
  ordersService,
  tasksService,
  quotationsService,
} from '../../services/db';
import { generateSystemAlerts, SystemAlert } from '../../lib/expirationAlerts';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'domain' | 'order'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const [hdList, oList, tList, qList] = await Promise.all([
        hostingDomainsService.getAll(),
        ordersService.getAll(),
        tasksService.getAll(),
        quotationsService.getAll(),
      ]);

      const generated = generateSystemAlerts({
        hostingDomains: hdList,
        orders: oList,
        tasks: tList,
        quotations: qList,
      });

      setAlerts(generated);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    // Auto refresh alerts every 60 seconds
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const urgentCount = alerts.filter((a) => a.severity === 'danger').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'urgent') return a.severity === 'danger' || a.severity === 'warning';
    if (activeTab === 'domain') return a.type === 'domain' || a.type === 'hosting' || a.type === 'ssl';
    if (activeTab === 'order') return a.type === 'order_deadline' || a.type === 'task_deadline' || a.type === 'quotation_expiry';
    return true;
  });

  const handleItemClick = (link: string) => {
    setIsOpen(false);
    navigate(link);
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'domain':
        return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'hosting':
        return <Server className="w-4 h-4 text-emerald-600" />;
      case 'ssl':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'order_deadline':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'task_deadline':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'quotation_expiry':
        return <FileSpreadsheet className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Thông báo & Lịch nhắc hạn"
      >
        <Bell className="w-4 h-4" />

        {/* Counter Badge */}
        {alerts.length > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full border-2 border-white ${
              urgentCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
            }`}
          >
            {alerts.length > 99 ? '99+' : alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Thông Báo & Lịch Nhắc Hạn</span>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700">
                  {alerts.length}
                </span>
              )}
            </div>

            <button
              onClick={loadAlerts}
              className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
            >
              Làm mới
            </button>
          </div>

          {/* Quick Filter Tabs */}
          {alerts.length > 0 && (
            <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tất cả ({alerts.length})
              </button>
              {(urgentCount > 0 || warningCount > 0) && (
                <button
                  onClick={() => setActiveTab('urgent')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'urgent'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  Khẩn cấp ({urgentCount + warningCount})
                </button>
              )}
              <button
                onClick={() => setActiveTab('domain')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'domain'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tên miền & Host
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'order'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Đơn hàng & Task
              </button>
            </div>
          )}

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang quét thời hạn...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">Không có mục nào sắp hết hạn!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tất cả tên miền, hosting và deadline đều đang trong trạng thái an toàn.
                </p>
              </div>
            ) : (
              filteredAlerts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.link)}
                  className="p-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start gap-3 group"
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-all shrink-0">
                    {getAlertIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                          item.severity === 'danger'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.severity === 'warning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.daysLeft < 0
                          ? `Quá hạn ${Math.abs(item.daysLeft)}d`
                          : item.daysLeft === 0
                          ? 'Hôm nay'
                          : `Còn ${item.daysLeft} ngày`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 self-center transition-colors" />
                </div>
              ))
            )}
          </div>

          {/* Footer quick links */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/hosting-domains');
              }}
              className="text-brand-600 hover:text-brand-700 font-semibold"
            >
              Quản lý tên miền →
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/orders');
              }}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Xem đơn hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
