import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { Toaster } from 'react-hot-toast';

// PAGES
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MasterSchedule from './pages/MasterSchedule';
import Inbox from './pages/Inbox';
import FacultyDirectory from './pages/FacultyDirectory';
import LeaveRequest from './pages/LeaveRequest';
import HODLeaveRequest from './pages/HODLeaveRequest';
import LeaveApproval from './pages/LeaveApproval';
import SubstituteAssignment from './pages/SubstituteAssignment';
import SubstituteReport from './pages/SubstituteReport';
import SubstituteAnalytics from './pages/SubstituteAnalytics';
import StudentDirectory from './pages/StudentDirectory';
import HodDashboard from './pages/HodDashboard';
import SubjectManager from './pages/SubjectManager';
import AuditLogViewer from './pages/AuditLogViewer';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AutomationDashboard from './pages/AutomationDashboard';
import Attendance from './pages/Attendance';
import Analytics from './pages/Analytics';
import RoleDashboard from './pages/RoleDashboard';

// NEW: Role-based features
import LeaveManagement from './pages/LeaveManagement';
import AssignmentManager from './pages/AssignmentManager';
import CreateAssignment from './pages/CreateAssignment';
import AssignmentDetails from './pages/AssignmentDetails';

import PersonalTimetable from './pages/PersonalTimetable';
import Announcements from './pages/Announcements';
import ResourceLibrary from './pages/ResourceLibrary';
import FacultyEvaluations from './pages/FacultyEvaluations';
import UserRoleManagement from './pages/UserRoleManagement';
import StudentPerformanceReports from './pages/StudentPerformanceReports';
import AttendanceTrends from './pages/AttendanceTrends';
import DepartmentMetrics from './pages/DepartmentMetrics';
import TeacherAnalytics from './pages/TeacherAnalytics';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import SystemSettings from './pages/SystemSettings';
import AuditLogs from './pages/AuditLogs';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DataManagement from './pages/DataManagement';
import AttendanceLauncher from './pages/AttendanceLauncher';
import NotFound from './pages/NotFound';

import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './components/AdminLayout';
import UserCredentials from './pages/UserCredentials';
import TeacherLayout from './components/TeacherLayout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex h-screen items-center justify-center bg-bg-dark text-white">Loading Auth...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

// Conditional Leave Request Router - HOD vs Teacher
const LeaveRequestRouter = () => {
  const { user } = useContext(AuthContext);

  // Check if user is HOD or Acting HOD
  const isHOD = user?.is_hod === 1 || user?.is_acting_hod === 1;

  return isHOD ? <HODLeaveRequest /> : <LeaveRequest />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* ADMIN ROUTES - /admin/* */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="faculty" element={<FacultyDirectory />} />
        <Route path="students" element={<StudentDirectory />} />
        <Route path="subjects" element={<SubjectManager />} />
        <Route path="schedule" element={<MasterSchedule />} />
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="substitutes" element={<SubstituteAssignment />} />
        <Route path="evaluations" element={<FacultyEvaluations />} />
        <Route path="student-reports" element={<StudentPerformanceReports />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="attendance-trends" element={<AttendanceTrends />} />
        <Route path="dept-metrics" element={<DepartmentMetrics />} />
        <Route path="predictive" element={<PredictiveAnalytics />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="user-roles" element={<UserRoleManagement />} />
        <Route path="notifications" element={<Inbox />} />
        <Route path="users-credentials" element={<UserCredentials />} />
        <Route path="data-management" element={<DataManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="automation" element={<AutomationDashboard />} />
      </Route>

      {/* TEACHER/HOD ROUTES - /* */}
      <Route path="/" element={<ProtectedRoute><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<RoleDashboard />} />
        <Route path="analytics" element={<Analytics />} />

        <Route path="schedule" element={<MasterSchedule />} />
        <Route path="notifications" element={<Inbox />} />
        <Route path="faculty" element={<FacultyDirectory />} />
        <Route path="students" element={<StudentDirectory />} />

        <Route path="subjects" element={<SubjectManager />} />
        <Route path="hod" element={<HodDashboard />} />

        <Route path="audit" element={<AuditLogViewer />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="system-settings" element={<SystemSettings />} />
        <Route path="attendance" element={<AttendanceLauncher />} />
        <Route path="attendance/:id/:classYear" element={<Attendance />} />

        {/* Teacher Features */}
        <Route path="leave-request" element={<LeaveRequestRouter />} />
        <Route path="leave/request" element={<LeaveRequestRouter />} />
        <Route path="assignments" element={<AssignmentManager />} />
        <Route path="assignments/create" element={<CreateAssignment />} />
        <Route path="assignments/:id" element={<AssignmentDetails />} />
        <Route path="timetable" element={<PersonalTimetable />} />

        {/* HOD Features */}
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="leave/approval" element={<LeaveApproval />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="substitute-assignment" element={<SubstituteAssignment />} />
        <Route path="substitute/assign" element={<SubstituteAssignment />} />
        <Route path="substitute/report" element={<SubstituteReport />} />
        <Route path="substitute/analytics" element={<SubstituteAnalytics />} />
        <Route path="faculty-evaluations" element={<FacultyEvaluations />} />
        <Route path="student-reports" element={<StudentPerformanceReports />} />
        <Route path="user-roles" element={<UserRoleManagement />} />

        {/* Analytics Pages */}
        <Route path="attendance-trends" element={<AttendanceTrends />} />
        <Route path="predictive-analytics" element={<PredictiveAnalytics />} />
        <Route path="data-management" element={<DataManagement />} />
        <Route path="user-credentials" element={<UserCredentials />} />
      </Route>

      {/* 404 for authenticated users */}
      <Route path="/404" element={<NotFound />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              className: '',
              style: {
                background: '#0f172a', // Slate 900
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                duration: 5000,
              },
              success: {
                iconTheme: {
                  primary: '#10b981', // Emerald 500
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f43f5e', // Rose 500
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
