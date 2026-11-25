import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { CustomerDetailPage } from './pages/admin/CustomerDetailPage';
import { ServicesPage } from './pages/admin/ServicesPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { CreateOrderPage } from './pages/admin/CreateOrderPage';
import { OrderDetailPage } from './pages/admin/OrderDetailPage';
import { OrderPrintView } from './pages/admin/OrderPrintView';
import { QuotationsPage } from './pages/admin/QuotationsPage';
import { CreateQuotationPage } from './pages/admin/CreateQuotationPage';
import { QuotationDetailPage } from './pages/admin/QuotationDetailPage';
import { QuotationPrintView } from './pages/admin/QuotationPrintView';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { ProjectsPage } from './pages/admin/ProjectsPage';
import { ProjectDetailPage } from './pages/admin/ProjectDetailPage';
import { TasksPage } from './pages/admin/TasksPage';
import { HostingDomainsPage } from './pages/admin/HostingDomainsPage';
import { HandoversPage } from './pages/admin/HandoversPage';
import { HandoverDetailPage } from './pages/admin/HandoverDetailPage';
import { HandoverPrintView } from './pages/admin/HandoverPrintView';
import { SupportRequestsPage } from './pages/admin/SupportRequestsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Customer Portal Pages
import { CustomerDashboardPage } from './pages/portal/CustomerDashboardPage';
import { CustomerOrdersPage } from './pages/portal/CustomerOrdersPage';
import { CustomerQuotationsPage } from './pages/portal/CustomerQuotationsPage';
import { CustomerProjectsPage } from './pages/portal/CustomerProjectsPage';
import { CustomerPaymentsPage } from './pages/portal/CustomerPaymentsPage';
import { CustomerSupportPage } from './pages/portal/CustomerSupportPage';
import { CustomerHandoverPage } from './pages/portal/CustomerHandoverPage';

const RootRedirect: React.FC = () => {
  const { currentUser, role } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === 'customer') return <Navigate to="/portal/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Root & Auth */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Standalone Printable Routes (accessible by both Admin and Clients) */}
            <Route path="/admin/orders/:id/print" element={<OrderPrintView />} />
            <Route path="/admin/quotations/:id/print" element={<QuotationPrintView />} />
            <Route path="/admin/handovers/:id/print" element={<HandoverPrintView />} />

            {/* Admin Portal Protected Routes */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/new" element={<CreateOrderPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="quotations" element={<QuotationsPage />} />
                <Route path="quotations/new" element={<CreateQuotationPage />} />
                <Route path="quotations/:id" element={<QuotationDetailPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="hosting-domains" element={<HostingDomainsPage />} />
                <Route path="handovers" element={<HandoversPage />} />
                <Route path="handovers/:id" element={<HandoverDetailPage />} />
                <Route path="support" element={<SupportRequestsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Customer Portal Protected Routes */}
            <Route element={<ProtectedRoute requiredRole="customer" />}>
              <Route path="/portal" element={<CustomerLayout />}>
                <Route index element={<Navigate to="/portal/dashboard" replace />} />
                <Route path="dashboard" element={<CustomerDashboardPage />} />
                <Route path="orders" element={<CustomerOrdersPage />} />
                <Route path="quotations" element={<CustomerQuotationsPage />} />
                <Route path="projects" element={<CustomerProjectsPage />} />
                <Route path="payments" element={<CustomerPaymentsPage />} />
                <Route path="support" element={<CustomerSupportPage />} />
                <Route path="handover" element={<CustomerHandoverPage />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
