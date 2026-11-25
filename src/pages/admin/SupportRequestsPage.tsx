import React, { useState, useEffect } from 'react';
import { LifeBuoy, Search, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supportRequestsService, customersService, ordersService } from '../../services/db';
import { SupportRequest, Customer, Order, SupportRequestStatus } from '../../types';
import { formatDate, formatDateTime } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/SearchBar';

export const SupportRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedReq, setSelectedReq] = useState<SupportRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState<SupportRequestStatus>('in_progress');

  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [rList, cList, oList] = await Promise.all([
        supportRequestsService.getAll(),
        customersService.getAll(),
        ordersService.getAll(),
      ]);
      setRequests(rList);

      const cMap: Record<string, Customer> = {};
      cList.forEach((c) => {
        cMap[c.id] = c;
      });
      setCustomers(cMap);

      const oMap: Record<string, Order> = {};
      oList.forEach((o) => {
        oMap[o.id] = o;
      });
      setOrders(oMap);
    } catch (err: any) {
      error(err.message || 'Lỗi tải yêu cầu hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = (req: SupportRequest) => {
    setSelectedReq(req);
    setReplyText(req.adminReply || '');
    setStatusUpdate(req.status);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      await supportRequestsService.update(selectedReq.id, {
        adminReply: replyText,
        status: statusUpdate,
        resolvedAt: statusUpdate === 'resolved' ? new Date().toISOString() : undefined,
      });

      success('Đã cập nhật phản hồi hỗ trợ cho khách hàng');
      setSelectedReq(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu phản hồi');
    }
  };

  const filtered = requests.filter((r) => {
    const cust = customers[r.customerId];
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Yêu Cầu Chỉnh Sửa & Hỗ Trợ</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tiếp nhận và phản hồi các yêu cầu thay đổi giao diện, bổ sung tính năng từ khách hàng
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm yêu cầu..."
        isFiltered={Boolean(search || statusFilter !== 'all')}
        onResetFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Mới tiếp nhận (Open)</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã hoàn thành</option>
            <option value="closed">Đã đóng</option>
          </select>
        }
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="w-8 h-8 text-slate-400" />}
          title="Không có yêu cầu hỗ trợ nào"
          description="Hiện tại không có yêu cầu hỗ trợ hoặc chỉnh sửa nào tồn đọng."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Tiêu đề yêu cầu</th>
                  <th className="py-3 px-4">Ngày gửi</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Phản hồi của Admin</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => {
                  const cust = customers[req.customerId];

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cust?.name || 'Khách hàng'}</div>
                        <div className="text-[11px] text-slate-400">{cust?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{req.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{req.content}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(req.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            req.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'in_progress'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {{
                            open: 'Mới gửi',
                            in_progress: 'Đang xử lý',
                            resolved: 'Đã hoàn tất',
                            closed: 'Đã đóng',
                          }[req.status] || req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {req.adminReply ? (
                          <span className="text-slate-800 font-medium">{req.adminReply}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa trả lời</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(req)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition"
                        >
                          Xử lý
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

      {/* Reply Modal */}
      {selectedReq && (
        <Modal
          isOpen={Boolean(selectedReq)}
          onClose={() => setSelectedReq(null)}
          title="Xử Lý Yêu Cầu Hỗ Trợ"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveReply} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Khách hàng: <strong>{customers[selectedReq.customerId]?.name}</strong></span>
                <span>Gửi lúc: {formatDateTime(selectedReq.createdAt)}</span>
              </div>
              <div className="font-bold text-slate-800 text-sm">{selectedReq.title}</div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedReq.content}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cập nhật trạng thái</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value as SupportRequestStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="open">Mới tiếp nhận (Open)</option>
                <option value="in_progress">Đang xử lý (In Progress)</option>
                <option value="resolved">Đã xử lý xong (Resolved)</option>
                <option value="closed">Đóng yêu cầu (Closed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phản hồi gửi khách hàng (Hiển thị ngay trên Customer Portal)
              </label>
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập thông tin kết quả xử lý hoặc giải đáp thắc mắc..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition"
              >
                Lưu và gửi phản hồi
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
