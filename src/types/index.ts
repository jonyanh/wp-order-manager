// TypeScript Interfaces for WP Order Manager
// 10 Collections + Supporting Types

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string; // document id (matches auth uid)
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  customerId?: string; // Links to customers collection if role is 'customer'
  active: boolean;
  createdAt: string;
}

export type CustomerSource = 'referral' | 'facebook' | 'google' | 'zalo' | 'direct' | 'other';
export type CustomerStatus = 'potential' | 'active' | 'completed' | 'inactive';

export interface Customer {
  id: string;
  customerCode: string; // e.g. KH-001
  name: string;
  phone: string;
  email: string;
  company?: string;
  address?: string;
  taxCode?: string;
  source: CustomerSource;
  status: CustomerStatus;
  note?: string;
  isDeleted?: boolean; // Soft delete
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string; // gói, trang, năm, tháng, cái
  defaultPrice: number;
  category: string; // Thiết kế web, Tên miền/Hosting, Tính năng thêm, Bảo trì
  active: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'new'              // Mới
  | 'consulting'       // Đang tư vấn
  | 'quote_sent'       // Đã gửi báo giá
  | 'pending_confirm'  // Chờ xác nhận
  | 'deposited'        // Đã đặt cọc
  | 'in_progress'      // Đang triển khai
  | 'review'           // Chờ duyệt
  | 'revising'         // Đang chỉnh sửa
  | 'accepted'         // Đã nghiệm thu
  | 'paid'             // Đã thanh toán
  | 'completed'        // Hoàn thành
  | 'cancelled';       // Đã hủy

export interface OrderItem {
  id: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface Order {
  id: string;
  orderCode: string; // WP-YYYYMM-XXXX
  customerId: string;
  customerName?: string; // Denormalized for display/sorting
  customerPhone?: string;
  customerEmail?: string;
  title: string;
  websiteType: string; // Bán hàng, Doanh nghiệp, Landing page, Blog, Bất động sản, Tin tức
  domain?: string;
  description?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  startDate: string;
  deadline: string;
  note?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

export interface Quotation {
  id: string;
  quotationCode: string; // BG-YYYYMM-XXXX
  customerId: string;
  orderId?: string;
  title: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  terms: string;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'bank_transfer' | 'cash' | 'momo' | 'vnpay' | 'other';
export type PaymentType = 'deposit' | 'installment' | 'final' | 'full';

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentDate: string;
  transactionCode?: string;
  note?: string;
  createdAt: string;
}

export interface ProjectStage {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

export type ProjectStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'paused';

export interface Project {
  id: string;
  orderId: string;
  customerId: string;
  projectName: string;
  websiteUrl?: string;
  progress: number; // 0-100%
  currentStage: number; // 1 to 11
  stages: ProjectStage[];
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  orderId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  completedAt?: string;
  visibleToCustomer: boolean; // Flag to show on Customer Portal
  createdAt: string;
}

export interface HostingDomain {
  id: string;
  customerId: string;
  orderId?: string;
  domain: string;
  hostingProvider: string;
  domainExpiry: string;
  hostingExpiry: string;
  sslExpiry: string;
  websiteUrl: string;
  note?: string;
  // Sensitive credentials are masked or hashed, not plain text
  hasAdminCredentials?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SupportRequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportRequest {
  id: string;
  customerId: string;
  orderId?: string;
  projectId?: string;
  title: string;
  content: string;
  attachments?: string[];
  status: SupportRequestStatus;
  adminReply?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Handover {
  id: string;
  orderId: string;
  projectId: string;
  customerId: string;
  websiteName: string;
  domain: string;
  websiteUrl: string;
  handoverDate: string;
  warrantyPeriod: string; // e.g. "12 tháng"
  warrantyTerms: string;
  checklist: {
    title: string;
    completed: boolean;
    description?: string;
  }[];
  manualDocUrl?: string;
  manualNotes?: string;
  status: 'draft' | 'handed_over' | 'accepted';
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  companyName: string;
  shortName: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  taxCode?: string;
  website?: string;
  bankAccount: string;
  bankName: string;
  bankHolder: string;
  vietQrUrl?: string;
  defaultTerms: string;
  currency: string;
  orderPrefix: string;
}
