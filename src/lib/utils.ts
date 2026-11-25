import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in VND (e.g., "1.500.000 ₫")
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Vietnamese format DD/MM/YYYY
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

// Format date & time DD/MM/YYYY HH:mm
export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

// Generate Order Code: WP-YYYYMM-XXXX
export function generateOrderCode(existingCount = 0): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomSuffix = String(existingCount + 1).padStart(4, '0');
  return `WP-${year}${month}-${randomSuffix}`;
}

// Generate Quotation Code: BG-YYYYMM-XXXX
export function generateQuotationCode(existingCount = 0): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomSuffix = String(existingCount + 1).padStart(4, '0');
  return `BG-${year}${month}-${randomSuffix}`;
}

// Generate Customer Code: KH-XXXX
export function generateCustomerCode(existingCount = 0): string {
  return `KH-${String(existingCount + 1).padStart(4, '0')}`;
}

// Standard 11 WordPress Project Stages
export const STANDARD_WP_STAGES = [
  { id: 1, name: '1. Tiếp nhận yêu cầu', description: 'Trao đổi, thu thập yêu cầu chi tiết của khách hàng về giao diện và chức năng.' },
  { id: 2, name: '2. Thu thập nội dung', description: 'Tiếp nhận logo, hình ảnh, bài viết, thông tin liên hệ và tài liệu từ khách hàng.' },
  { id: 3, name: '3. Chuẩn bị hosting & domain', description: 'Đăng ký hoặc nhận thông tin cấu hình DNS tên miền và chuẩn bị máy chủ lưu trữ.' },
  { id: 4, name: '4. Cài đặt WordPress', description: 'Khởi tạo mã nguồn WordPress, cấu hình SSL, Database và các plugin cốt lõi.' },
  { id: 5, name: '5. Thiết kế giao diện', description: 'Cài đặt theme, dàn layout trang chủ, trang con, header, footer và phối màu theo thương hiệu.' },
  { id: 6, name: '6. Xây dựng chức năng', description: 'Lập trình các tính năng: form liên hệ, giỏ hàng, đặt lịch, đa ngôn ngữ, thanh toán...' },
  { id: 7, name: '7. Nhập dữ liệu', description: 'Đăng tải sản phẩm, dịch vụ, bài viết mẫu và tối ưu hiển thị hình ảnh.' },
  { id: 8, name: '8. Tối ưu SEO & Tốc độ', description: 'Cài đặt plugin SEO (RankMath/Yoast), sitemap, nén ảnh WebP, cấu hình cache tăng tốc.' },
  { id: 9, name: '9. Kiểm tra website', description: 'Test responsive trên Mobile/Tablet/Desktop, test form, liên kết và tốc độ tải.' },
  { id: 10, name: '10. Nghiệm thu', description: 'Gửi demo cho khách hàng duyệt, tiếp nhận và hoàn thiện các góp ý chỉnh sửa.' },
  { id: 11, name: '11. Bàn giao & Hướng dẫn', description: 'Chuyển giao quyền quản trị, hướng dẫn quản trị nội dung và bàn giao tài liệu kỹ thuật.' },
];

// Helper to export data to CSV (with UTF-8 BOM for Excel)
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
