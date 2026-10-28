import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRoute from './components/layout/RoleRoute';

import LandingPage from './pages/public/LandingPage';
import ServicesPage from './pages/public/ServicesPage';
import WorkerPublicPage from './pages/public/WorkerPublicPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import SupportPage from './pages/public/SupportPage';
import NotFoundPage from './pages/public/NotFoundPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import WorkerRegisterPage from './pages/auth/WorkerRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import UserDashboard from './pages/user/UserDashboard';
import UserBookings from './pages/user/UserBookings';
import UserBookingDetail from './pages/user/UserBookingDetail';
import BookingFormPage from './pages/user/BookingFormPage';
import UserProfile from './pages/user/UserProfile';

import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerBookings from './pages/worker/WorkerBookings';
import WorkerBookingDetail from './pages/worker/WorkerBookingDetail';
import WorkerProfilePage from './pages/worker/WorkerProfilePage';
import WorkerAvailabilityPage from './pages/worker/WorkerAvailabilityPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminWorkers from './pages/admin/AdminWorkers';
import AdminWorkerDetail from './pages/admin/AdminWorkerDetail';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBookings from './pages/admin/AdminBookings';
import AdminBookingDetail from './pages/admin/AdminBookingDetail';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

import NotificationsPage from './pages/shared/NotificationsPage';
import DashboardSupportPage from './pages/shared/DashboardSupportPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <SocketProvider>
            <ScrollToTop />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="workers/:id" element={<WorkerPublicPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="support" element={<SupportPage />} />
              </Route>

              <Route path="login" element={<LoginPage role="customer" />} />
              <Route path="worker/login" element={<LoginPage role="worker" />} />
              <Route path="admin/login" element={<Navigate to="/login" replace />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="worker/register" element={<WorkerRegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />

              <Route
                path="app"
                element={
                  <RoleRoute roles={['customer']}>
                    <DashboardLayout />
                  </RoleRoute>
                }
              >
                <Route index element={<UserDashboard />} />
                <Route path="bookings" element={<UserBookings />} />
                <Route path="bookings/:id" element={<UserBookingDetail />} />
                <Route path="book/:workerId" element={<BookingFormPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="support" element={<DashboardSupportPage />} />
              </Route>

              <Route
                path="worker"
                element={
                  <RoleRoute roles={['worker']}>
                    <DashboardLayout />
                  </RoleRoute>
                }
              >
                <Route index element={<WorkerDashboard />} />
                <Route path="bookings" element={<WorkerBookings />} />
                <Route path="bookings/:id" element={<WorkerBookingDetail />} />
                <Route path="profile" element={<WorkerProfilePage />} />
                <Route path="availability" element={<WorkerAvailabilityPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="support" element={<DashboardSupportPage />} />
              </Route>

              <Route
                path="admin"
                element={
                  <RoleRoute roles={['admin']}>
                    <DashboardLayout />
                  </RoleRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="workers" element={<AdminWorkers />} />
                <Route path="workers/:id" element={<AdminWorkerDetail />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="bookings/:id" element={<AdminBookingDetail />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
