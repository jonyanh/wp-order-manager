import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Printer, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/db';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { OrderStatusBadge } from '../../components/common/Badge';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerOrdersPage: React.FC = () => {
  const { customerId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!customerId) return;
      try {
        setLoading(true);
        const list = await ordersService.getByCustomerId(customerId);
        setOrders(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Đơn Hàng Thiết Kế Website Của Bạn</h1>
        <p className="text-xs text-slate-500 mt-1">Danh sách hợp đồng và các hạng mục website đã ký kết</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
          title="Bạn chưa có đơn hàng nào"
          description="Vui lòng liên hệ quản trị viên để nhận tư vấn và lập đơn hàng mới."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-600 text-sm">{order.orderCode}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800 mt-1">{order.title}</h2>
                  {order.domain && (
                    <span className="text-xs font-mono text-slate-500 mt-0.5 block">Tên miền: {order.domain}</span>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">{formatCurrency(order.total)}</div>
                  <div className="text-xs text-emerald-600 font-medium">Đã thanh toán: {formatCurrency(order.paidAmount)}</div>
                  <div className="text-xs text-amber-600 font-semibold">Còn lại: {formatCurrency(order.remainingAmount)}</div>
                </div>
              </div>

              {/* Items breakdown */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Hạng mục triển khai
                </span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between bg-slate-50/50">
                      <div>
                        <span className="font-medium text-slate-800">{it.name}</span>
                        <span className="text-slate-400 text-[11px] block">Số lượng: {it.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-800">{formatCurrency(it.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span>Bắt đầu: {formatDate(order.startDate)}</span>
                  <span>Hạn bàn giao: <strong className="text-slate-800">{formatDate(order.deadline)}</strong></span>
                </div>

                <Link
                  to={`/admin/orders/${order.id}/print`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Tải PDF đơn hàng</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
