import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { RoleRoute } from './components/RoleRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import ApplicantLayout from './layouts/ApplicantLayout';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Pages
import GatePage from './pages/GatePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MainFaqPage from './pages/FaqPage';


import NotFoundPage from './pages/NotFoundPage';

// Applicant pages
import ApplicantDashboard from './pages/applicant/Dashboard';
import ApplicantProfile from './pages/applicant/Profile';
import BookAppointment from './pages/applicant/BookAppointment';
import SurveyAppointment from './pages/applicant/SurveyAppointment';
import MyAppointments from './pages/applicant/MyAppointments';
import ApplicantFAQCategoryPage from './pages/applicant/FAQCategoryPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAppointments from './pages/admin/Appointments';
import AdminAppointmentDetails from './pages/admin/AppointmentDetails';
import AdminEntries from './pages/admin/Entries';
import AdminFaqs from './pages/admin/Faqs';
import AdminEmployees from './pages/admin/Employees';
import AdminBonuses from './pages/admin/Bonuses';
import AdminTargets from './pages/admin/Targets';
import AdminUsers from './pages/admin/Users';
import ScheduleControl from './pages/admin/ScheduleControl';
import AdminDailyWork from './pages/admin/DailyWork';
import AdminDailyWorkDetails from './pages/admin/DailyWorkDetails';

// Employee pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeBonuses from './pages/employee/Bonuses';
import EmployeeTargets from './pages/employee/Targets';
import EmployeeDailyWork from './pages/employee/DailyWork';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />

        <Routes>
          {/* Gate */}
          <Route path="/" element={<GatePage />} />

          {/* Public pages */}
          <Route element={<PublicLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/faq" element={<MainFaqPage />} />
            <Route path="/faq/:categorySlug" element={<MainFaqPage />} />
          </Route>

          {/* Auth pages — بدون Layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Applicant */}
          <Route
            element={
              <RoleRoute allowedRoles={['APPLICANT']}>
                <ApplicantLayout />
              </RoleRoute>
            }
          >
            <Route path="/app/dashboard" element={<ApplicantDashboard />} />
            <Route path="/app/profile" element={<ApplicantProfile />} />
            <Route path="/app/appointments/book" element={<BookAppointment />} />
            <Route path="/app/appointments/survey" element={<SurveyAppointment />} />
            <Route path="/app/appointments/my" element={<MyAppointments />} />
            <Route path="/app/faq/:categorySlug" element={<ApplicantFAQCategoryPage />} />
            <Route path="/app/faq/:categorySlug/:questionId" element={<ApplicantFAQCategoryPage />} />
          </Route>

          {/* Admin */}
          <Route
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </RoleRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/appointments/:id" element={<AdminAppointmentDetails />} />
            <Route path="/admin/schedule-control" element={<ScheduleControl />} />
            <Route path="/admin/entries" element={<AdminEntries />} />
            <Route path="/admin/faqs" element={<AdminFaqs />} />
            <Route path="/admin/employees" element={<AdminEmployees />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bonuses" element={<AdminBonuses />} />
            <Route path="/admin/targets" element={<AdminTargets />} />
            <Route path="/admin/daily-work" element={<AdminDailyWork />} />
            <Route path="/admin/daily-work/:id" element={<AdminDailyWorkDetails />} />
          </Route>

          {/* Employee */}
          <Route
            element={
              <RoleRoute allowedRoles={['EMPLOYEE']}>
                <EmployeeLayout />
              </RoleRoute>
            }
          >
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/bonuses" element={<EmployeeBonuses />} />
            <Route path="/employee/targets" element={<EmployeeTargets />} />
            <Route path="/employee/daily-work" element={<EmployeeDailyWork />} />
          </Route>

          {/* Not Found */}
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
