import React, { useEffect, useState } from 'react';
import { LifeBuoy, Plus, Send, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supportRequestsService, projectsService, ordersService } from '../../services/db';
import { SupportRequest, Project, Order } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { EmptyState, LoadingSkeleton } from '../../components/common/EmptyState';

export const CustomerSupportPage: React.FC = () => {
  const { customerId } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const { success, error } = useToast();

  const loadData = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const [rList, pList, oList] = await Promise.all([
        supportRequestsService.getByCustomerId(customerId),
        projectsService.getByCustomerId(customerId),
        ordersService.getByCustomerId(customerId),
      ]);
      setRequests(rList);
      setProjects(pList);
      setOrders(oList);

      if (oList.length > 0 && !selectedOrderId) {
        setSelectedOrderId(oList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    if (!title.trim() || !content.trim()) {
      error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      await supportRequestsService.create({
        customerId,
        orderId: selectedOrderId,
        title,
        content,
      });

      success('Yêu cầu hỗ trợ đã được gửi thành công đến quản trị viên!');
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Lỗi gửi yêu cầu');
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Yêu Cầu Chỉnh Sửa & Hỗ Trợ Kỹ Thuật</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gửi yêu cầu góp ý giao diện, thêm tính năng hoặc báo lỗi trực tiếp tới quản trị viên
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Gửi yêu cầu mới</span>
        </button>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="w-8 h-8 text-slate-400" />}
          title="Bạn chưa có yêu cầu hỗ trợ nào"
          description="Bấm 'Gửi yêu cầu mới' nếu bạn cần chỉnh sửa nội dung, màu sắc hoặc chức năng website."
          action={{ label: 'Gửi yêu cầu', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      req.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : req.status === 'in_progress'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {{
                      open: 'Chờ tiếp nhận',
                      in_progress: 'Đang xử lý',
                      resolved: 'Đã hoàn thành',
                      closed: 'Đã đóng',
                    }[req.status] || req.status}
                  </span>
                  <span className="text-xs text-slate-400">Gửi lúc: {formatDateTime(req.createdAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">{req.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  {req.content}
                </p>
              </div>

              {/* Admin reply section */}
              {req.adminReply ? (
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phản hồi từ Quản trị viên (Admin):</span>
                  </div>
                  <p className="text-emerald-950 leading-relaxed pt-1 whitespace-pre-line">
                    {req.adminReply}
                  </p>
                  {req.resolvedAt && (
                    <span className="text-[10px] text-emerald-600 font-medium block pt-1">
                      Hoàn thành lúc: {formatDateTime(req.resolvedAt)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Quản trị viên đang xem xét yêu cầu của bạn.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal create request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gửi Yêu Cầu Chỉnh Sửa / Hỗ Trợ"
        description="Mô tả cụ thể vị trí hoặc tính năng bạn muốn bổ sung"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dự án / Đơn hàng liên quan</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderCode} - {o.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề yêu cầu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chỉnh sửa màu nút Đặt Hàng sang màu đỏ cam"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả cụ thể nội dung, trang cần chỉnh sửa, đính kèm link ảnh nếu có..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
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
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
