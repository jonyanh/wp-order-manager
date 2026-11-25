# WP Order Manager - Ứng Dụng Quản Lý Khách Hàng, Đơn Hàng & Dự Án WordPress

Hệ thống web application toàn diện dành cho Freelancer / Studio thiết kế website WordPress, phục vụ quản lý từ khâu tiếp nhận khách hàng, báo giá, hợp đồng đơn hàng, theo dõi tiến độ 11 giai đoạn kỹ thuật chuẩn WordPress, thanh toán thu chi cho đến bàn giao nghiệm thu và cổng thông tin dành riêng cho khách hàng (**Customer Portal**).

---

## 1. Công Nghệ Sử Dụng

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Lucide Icons, React Router v6, Recharts.
- **Database & Backend**: Firebase Authentication, Cloud Firestore (10 Collections chuẩn hóa), Firebase Storage, Firebase Hosting.
- **Styling**: Tối giản, hiện đại, màu chủ đạo Tím xanh (Indigo/Violet), background `#F8FAFC`, card trắng `#FFFFFF`, chữ `#1E293B`, viền `#E2E8F0`, chuẩn responsive trên Desktop, Tablet và Mobile.
- **Tiền tệ & Múi giờ**: VND (`1.000.000 ₫`), Múi giờ `Asia/Ho_Chi_Minh` (DD/MM/YYYY).

---

## 2. Cấu Trúc Hai Khu Vực Độc Lập

### A. ADMIN PORTAL (`/admin/*`)
1. **Dashboard**: Thống kê doanh thu, thực thu, công nợ, đơn hàng đang triển khai, biểu đồ tăng trưởng doanh thu Recharts, biểu đồ tỷ lệ trạng thái đơn, danh sách đơn hàng gần đây, công việc sắp tới hạn.
2. **Khách hàng**: Thêm, sửa, xóa mềm (ngăn chặn xóa khách hàng đã phát sinh giao dịch), tìm kiếm, lọc trạng thái, phân loại nguồn, xem lịch sử đơn hàng và công nợ.
3. **Bảng giá dịch vụ**: Danh mục gói thiết kế website, hosting, tính năng thêm và bảo trì làm mẫu khi lập báo giá.
4. **Đơn hàng**: Tự động sinh mã `WP-YYYYMM-XXXX`, chọn khách hàng, chọn dịch vụ mẫu, tính tiền tự động, chiết khấu, hạn bàn giao, cập nhật trạng thái đơn (12 trạng thái), in/xuất PDF hợp đồng đơn hàng.
5. **Báo giá**: Mã `BG-YYYYMM-XXXX`, thêm hạng mục, hạn báo giá, điều khoản, in/xuất PDF, nút 1 chạm **Chuyển thành Đơn hàng**.
6. **Thanh toán & Thu chi**: Ghi nhận đặt cọc, thanh toán nhiều đợt, lưu mã giao dịch, tự động tính tổng tiền đã thu và trừ công nợ trên đơn hàng, xuất file báo cáo CSV/Excel.
7. **Quản lý dự án**: Lộ trình 11 giai đoạn chuẩn WordPress (Tiếp nhận -> Nội dung -> Hosting/Domain -> Cài WP -> Thiết kế UI -> Chức năng -> Nhập liệu -> SEO -> Kiểm tra -> Nghiệm thu -> Bàn giao), thanh tiến độ %, timeline trực quan.
8. **Công việc (Tasks)**: Checklist nhiệm vụ, mức độ ưu tiên, deadline, cờ `visibleToCustomer` chủ động quyết định công việc nào được công khai cho khách hàng.
9. **Tên miền & Hosting**: Quản lý domain, hosting, ssl, nhà cung cấp, ngày hết hạn, cảnh báo gia hạn trong 30 ngày, bảo mật thông tin truy cập (không lưu mật khẩu dạng plain text).
10. **Bàn giao website**: Biên bản nghiệm thu & bàn giao có thể in/xuất PDF, checklist kiểm tra chất lượng, tài liệu & video hướng dẫn, chính sách bảo hành.
11. **Yêu cầu hỗ trợ**: Tiếp nhận các yêu cầu chỉnh sửa/bổ sung từ khách hàng, cập nhật trạng thái và gửi phản hồi.
12. **Báo cáo**: Thống kê doanh thu, dòng tiền theo tháng, cơ cấu thể loại website, ước tính chi phí và lợi nhuận (85%), xuất dữ liệu ra Excel/CSV.
13. **Cài đặt hệ thống**: Thông tin thương hiệu, thông tin ngân hàng & mã VietQR, điều khoản mẫu, khôi phục dữ liệu demo mẫu, xem và sao chép Firestore Security Rules.

### B. CUSTOMER PORTAL (`/portal/*`)
Khu vực dành riêng cho từng khách hàng, được bảo vệ nghiêm ngặt:
- Khách hàng chỉ xem đúng dữ liệu thuộc `customerId` của mình (Đơn hàng, dự án, lịch sử thanh toán).
- Hoàn toàn **không hiển thị**: Ghi chú nội bộ, chi phí vận hành, lợi nhuận, khách hàng khác hoặc công việc nội bộ của Admin.
- Xem tiến độ 11 giai đoạn và các công việc được phép hiển thị (`visibleToCustomer`).
- Hướng dẫn chuyển khoản với STK ngân hàng và mã VietQR.
- Gửi yêu cầu chỉnh sửa website / hỗ trợ kỹ thuật và xem phản hồi từ Admin.
- Xem tài liệu hướng dẫn quản trị và in biên bản bàn giao.

---

## 3. Cấu Trúc Thư Mục Dự Án

```
c:\Blog\
├── public/
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx     # Phân quyền Admin vs Customer Portal
│   │   ├── common/
│   │   │   ├── Badge.tsx              # Badge trạng thái đơn, task, KH
│   │   │   ├── ConfirmDialog.tsx      # Hộp thoại xác nhận thao tác quan trọng
│   │   │   ├── EmptyState.tsx         # Empty state & Skeleton loading
│   │   │   └── Modal.tsx              # Hộp thoại Modal hiện đại
│   │   └── layout/
│   │       ├── AdminLayout.tsx        # Layout Sidebar & Header Admin
│   │       └── CustomerLayout.tsx     # Layout Cổng Khách Hàng
│   ├── context/
│   │   ├── AuthContext.tsx            # Xác thực, lưu session, demo switcher
│   │   └── ToastContext.tsx           # Thông báo Toast nổi
│   ├── lib/
│   │   ├── firebase.ts                # Cấu hình Firebase SDK & fallback store
│   │   └── utils.ts                   # Định dạng tiền tệ, ngày giờ, CSV export
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx          # Trang đăng nhập & tài khoản test 1 chạm
│   │   ├── admin/                     # Toàn bộ 12 module quản trị Admin
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── CustomerDetailPage.tsx
│   │   │   ├── ServicesPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── CreateOrderPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   ├── OrderPrintView.tsx
│   │   │   ├── QuotationsPage.tsx
│   │   │   ├── CreateQuotationPage.tsx
│   │   │   ├── QuotationDetailPage.tsx
│   │   │   ├── QuotationPrintView.tsx
│   │   │   ├── PaymentsPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── HostingDomainsPage.tsx
│   │   │   ├── HandoversPage.tsx
│   │   │   ├── HandoverDetailPage.tsx
│   │   │   ├── HandoverPrintView.tsx
│   │   │   ├── SupportRequestsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── portal/                    # Module Customer Portal
│   │       ├── CustomerDashboardPage.tsx
│   │       ├── CustomerOrdersPage.tsx
│   │       ├── CustomerQuotationsPage.tsx
│   │       ├── CustomerProjectsPage.tsx
│   │       ├── CustomerPaymentsPage.tsx
│   │       ├── CustomerSupportPage.tsx
│   │       └── CustomerHandoverPage.tsx
│   ├── services/
│   │   ├── db.ts                      # Repository service cho 10 collections
│   │   └── seedData.ts                # Dữ liệu khởi tạo mẫu thực tế
│   ├── types/
│   │   └── index.ts                   # Toàn bộ TypeScript interfaces chuẩn hóa
│   ├── App.tsx                        # Router chính React Router v6
│   ├── index.css                      # Tailwind directives & Print stylesheet
│   ├── main.tsx                       # React 18 Entry
│   └── vite-env.d.ts
├── firestore.rules                    # Quy tắc bảo mật Firestore Production
├── storage.rules                      # Quy tắc bảo mật Storage Production
├── firebase.json                      # Cấu hình Deploy Firebase Hosting & Rules
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts                     # Cấu hình Rollup manualChunks tối ưu
```

---

## 4. Hướng Dẫn Chạy & Kiểm Thử

### Bước 1: Khởi động môi trường phát triển (Dev Server)
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:5173`.

### Bước 2: Kiểm thử với các tài khoản có sẵn
Tại trang Đăng nhập (`/login`), ứng dụng cung cấp sẵn các nút chọn tài khoản dùng thử tiện lợi:
1. **Quản trị viên (Admin)**: Toàn quyền quản trị tất cả 12 module.
2. **Khách hàng 1 (Nguyễn Văn An - Viet Organic)**: Xem đơn hàng bán hàng, tiến độ 45%, thanh toán 9.000.000 ₫, gửi yêu cầu hỗ trợ.
3. **Khách hàng 2 (Trần Thị Mai - Beauty Glow)**: Xem đơn hàng hoàn thành 100%, biên bản bàn giao, video hướng dẫn quản trị.

### Bước 3: Build Production
```bash
npm run build
```
Mã nguồn được biên dịch và tối ưu hóa vào thư mục `dist/` sẵn sàng triển khai lên Firebase Hosting.
