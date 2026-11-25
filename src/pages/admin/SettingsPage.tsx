import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Shield, Building2, CreditCard, Lock, Copy, CloudUpload, CheckCircle2, Trash2, Database } from 'lucide-react';
import { settingsService, resetDatabaseToFactory, seedToCloudFirestore, clearAllMockData, populateDemoData } from '../../services/db';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebase';
import { AppSettings } from '../../types';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedingFirebase, setSeedingFirebase] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'banking' | 'rules'>('general');

  const { success, error } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const s = await settingsService.get();
        setSettings(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await settingsService.update(settings);
      success('Đã lưu cấu hình hệ thống thành công!');
    } catch (err: any) {
      error(err.message || 'Lỗi khi lưu cài đặt');
    }
  };

  const handleClearAllData = () => {
    clearAllMockData();
    success('Đã xóa sạch toàn bộ dữ liệu mẫu! Hệ thống bây giờ hoàn toàn trống.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handlePopulateDemoData = () => {
    populateDemoData();
    success('Đã nạp bộ dữ liệu mẫu thử nghiệm thành công!');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Đã sao chép cấu hình Rules vào clipboard!');
  };

  if (loading || !settings) return <LoadingSkeleton rows={8} />;

  const firestoreRulesSample = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 1. Cho phép tài khoản Admin đã đăng nhập toàn quyền đọc/ghi
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'admin@gmail.com' ||
        request.auth.token.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    function isCustomer(customerId) {
      return isSignedIn() && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.customerId == customerId
      );
    }

    // USERS COLLECTION
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (request.auth.uid == userId || isAdmin());
    }

    // CUSTOMERS COLLECTION
    match /customers/{customerId} {
      allow read, write: if isAdmin() || isCustomer(customerId);
    }

    // SERVICES COLLECTION
    match /services/{serviceId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ORDERS COLLECTION
    match /orders/{orderId} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow create, update, delete: if isAdmin();
    }

    // QUOTATIONS COLLECTION
    match /quotations/{quotationId} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow write: if isAdmin();
    }

    // PAYMENTS COLLECTION
    match /payments/{paymentId} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow write: if isAdmin();
    }

    // PROJECTS COLLECTION
    match /projects/{projectId} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow write: if isAdmin();
    }

    // TASKS COLLECTION
    match /tasks/{taskId} {
      allow read: if isAdmin() || (resource.data.visibleToCustomer == true);
      allow write: if isAdmin();
    }

    // HOSTING & DOMAINS
    match /hosting_domains/{id} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow write: if isAdmin();
    }

    // SUPPORT REQUESTS
    match /support_requests/{reqId} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow create: if isSignedIn();
      allow update, delete: if isAdmin();
    }

    // HANDOVERS
    match /handovers/{handoverId} {
      allow read: if isAdmin() || isCustomer(resource.data.customerId);
      allow write: if isAdmin();
    }

    // SETTINGS
    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Cài Đặt Hệ Thống</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Firebase: {firebaseConfig.projectId}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập thông tin thương hiệu, tài khoản ngân hàng, mẫu báo giá và kết nối Cloud Firestore
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Clear mock data button */}
          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Xóa sạch dữ liệu ảo (CSDL trống)</span>
          </button>

          {/* Seed to cloud */}
          <button
            type="button"
            disabled={seedingFirebase}
            onClick={async () => {
              try {
                setSeedingFirebase(true);
                await seedToCloudFirestore();
                success('Đã đẩy toàn bộ dữ liệu mẫu lên Cloud Firestore (wp-order-manager) thành công!');
              } catch (err: any) {
                error(err.message || 'Lỗi khi đồng bộ dữ liệu lên Firebase');
              } finally {
                setSeedingFirebase(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-xl border border-brand-200 transition"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{seedingFirebase ? 'Đang đồng bộ...' : 'Đẩy dữ liệu lên Cloud Firestore'}</span>
          </button>

          {/* Populate demo */}
          <button
            type="button"
            onClick={handlePopulateDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Nạp lại mẫu demo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'general' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Thông tin Freelancer / Studio
        </button>
        <button
          onClick={() => setActiveTab('banking')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'banking' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Ngân hàng & VietQR
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'rules' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Bảo Mật & Firestore Rules (Quan Trọng)
        </button>
      </div>

      {/* Tab: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Thông Tin Thương Hiệu & Người Bán</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thương hiệu / Studio</label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên viết tắt</label>
              <input
                type="text"
                value={settings.shortName}
                onChange={(e) => setSettings({ ...settings, shortName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email hỗ trợ</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ làm việc / Studio</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Banking & VietQR */}
      {activeTab === 'banking' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Thông Tin Tài Khoản Ngân Hàng & Thanh Toán</h2>
          <p className="text-xs text-slate-500">
            Thông tin này sẽ tự động xuất hiện trên Hóa đơn, Báo giá in ấn và cổng Portal của Khách hàng
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên ngân hàng</label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                placeholder="VD: Vietcombank, Techcombank, MBBank"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số tài khoản</label>
              <input
                type="text"
                value={settings.bankAccount}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chủ tài khoản (In hoa)</label>
              <input
                type="text"
                value={settings.bankHolder}
                onChange={(e) => setSettings({ ...settings, bankHolder: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL ảnh VietQR hoặc link QR</label>
            <input
              type="url"
              value={settings.vietQrUrl || ''}
              onChange={(e) => setSettings({ ...settings, vietQrUrl: e.target.value })}
              placeholder="https://img.vietqr.io/image/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình ngân hàng</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Security & Firestore Rules */}
      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Quy Tắc Phân Quyền Firestore (Security Rules)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Để các thao tác Thêm / Sửa / Xóa / Xác nhận lưu trực tiếp lên Cloud Firestore mà không bị lỗi Permission Denied:
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(firestoreRulesSample)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép mã Rules</span>
            </button>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <strong>Hướng dẫn áp dụng trong 30 giây:</strong>
            <ol className="list-decimal list-inside mt-1.5 space-y-1">
              <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a>, chọn project <strong>wp-order-manager</strong>.</li>
              <li>Vào mục <strong>Firestore Database</strong> ở thanh menu bên trái, sau đó chọn tab <strong>Rules</strong> ở phía trên.</li>
              <li>Dán đoạn mã bên dưới vào thay thế toàn bộ nội dung cũ và bấm nút <strong>Publish</strong>.</li>
            </ol>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
            {firestoreRulesSample}
          </pre>
        </div>
      )}

      {/* Confirm Clear All Data */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearAllData}
        title="Xóa sạch toàn bộ dữ liệu mẫu?"
        message="Hành động này sẽ xóa toàn bộ khách hàng, đơn hàng, báo giá mẫu hiện có, trả hệ thống về trạng thái hoàn toàn trống để bạn tự tạo dữ liệu thật của chính mình."
        confirmText="Xác nhận xóa sạch"
      />
    </div>
  );
};
