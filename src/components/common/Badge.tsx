import React from 'react';
import { OrderStatus, QuotationStatus, TaskPriority, TaskStatus, CustomerStatus } from '../../types';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  switch (status) {
    case 'new':
      return <Badge variant="info">Mới</Badge>;
    case 'consulting':
      return <Badge variant="info">Đang tư vấn</Badge>;
    case 'quote_sent':
      return <Badge variant="purple">Đã gửi báo giá</Badge>;
    case 'pending_confirm':
      return <Badge variant="warning">Chờ xác nhận</Badge>;
    case 'deposited':
      return <Badge variant="purple">Đã đặt cọc</Badge>;
    case 'in_progress':
      return <Badge variant="info">Đang triển khai</Badge>;
    case 'review':
      return <Badge variant="warning">Chờ duyệt</Badge>;
    case 'revising':
      return <Badge variant="warning">Đang chỉnh sửa</Badge>;
    case 'accepted':
      return <Badge variant="success">Đã nghiệm thu</Badge>;
    case 'paid':
      return <Badge variant="success">Đã thanh toán</Badge>;
    case 'completed':
      return <Badge variant="success">Hoàn thành</Badge>;
    case 'cancelled':
      return <Badge variant="danger">Đã hủy</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const QuotationStatusBadge: React.FC<{ status: QuotationStatus }> = ({ status }) => {
  switch (status) {
    case 'draft':
      return <Badge variant="default">Bản nháp</Badge>;
    case 'sent':
      return <Badge variant="info">Đã gửi</Badge>;
    case 'accepted':
      return <Badge variant="success">Đã chấp nhận</Badge>;
    case 'rejected':
      return <Badge variant="danger">Từ chối</Badge>;
    case 'converted':
      return <Badge variant="purple">Đã tạo đơn</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'todo':
      return <Badge variant="default">Cần làm</Badge>;
    case 'in_progress':
      return <Badge variant="info">Đang làm</Badge>;
    case 'done':
      return <Badge variant="success">Hoàn thành</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  switch (priority) {
    case 'low':
      return <Badge variant="default">Thấp</Badge>;
    case 'medium':
      return <Badge variant="warning">Trung bình</Badge>;
    case 'high':
      return <Badge variant="danger">Ưu tiên cao</Badge>;
  }
};

export const CustomerStatusBadge: React.FC<{ status: CustomerStatus }> = ({ status }) => {
  switch (status) {
    case 'potential':
      return <Badge variant="info">Tiềm năng</Badge>;
    case 'active':
      return <Badge variant="success">Đang hợp tác</Badge>;
    case 'completed':
      return <Badge variant="purple">Đã hoàn thành</Badge>;
    case 'inactive':
      return <Badge variant="default">Ngưng hoạt động</Badge>;
  }
};
