import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

// PAGES
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MasterSchedule = lazy(() => import('./pages/MasterSchedule'));
const Inbox = lazy(() => import('./pages/Inbox'));
const FacultyDirectory = lazy(() => import('./pages/FacultyDirectory'));
const LeaveRequest = lazy(() => import('./pages/LeaveRequest'));
const HODLeaveRequest = lazy(() => import('./pages/HODLeaveRequest'));
const LeaveApproval = lazy(() => import('./pages/LeaveApproval'));
const SubstituteAssignment = lazy(() => import('./pages/SubstituteAssignment'));
const SubstituteReport = lazy(() => import('./pages/SubstituteReport'));
const SubstituteAnalytics = lazy(() => import('./pages/SubstituteAnalytics'));
const StudentDirectory = lazy(() => import('./pages/StudentDirectory'));
const HodDashboard = lazy(() => import('./pages/HodDashboard'));
const SubjectManager = lazy(() => import('./pages/SubjectManager'));
const AuditLogViewer = lazy(() => import('./pages/AuditLogViewer'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AutomationDashboard = lazy(() => import('./pages/AutomationDashboard'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Analytics = lazy(() => import('./pages/Analytics'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard'));

// NEW: Role-based features
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const AssignmentManager = lazy(() => import('./pages/AssignmentManager'));
const CreateAssignment = lazy(() => import('./pages/CreateAssignment'));
const AssignmentDetails = lazy(() => import('./pages/AssignmentDetails'));

const PersonalTimetable = lazy(() => import('./pages/PersonalTimetable'));
const Announcements = lazy(() => import('./pages/Announcements'));
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary'));
const FacultyEvaluations = lazy(() => import('./pages/FacultyEvaluations'));
const UserRoleManagement = lazy(() => import('./pages/UserRoleManagement'));
const StudentPerformanceReports = lazy(() => import('./pages/StudentPerformanceReports'));
const AttendanceTrends = lazy(() => import('./pages/AttendanceTrends'));
const DepartmentMetrics = lazy(() => import('./pages/DepartmentMetrics'));
const TeacherAnalytics = lazy(() => import('./pages/TeacherAnalytics'));
const PredictiveAnalytics = lazy(() => import('./pages/PredictiveAnalytics'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const AttendanceLauncher = lazy(() => import('./pages/AttendanceLauncher'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-dark text-white">Loading Module...</div>}>
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
    </Suspense>
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
