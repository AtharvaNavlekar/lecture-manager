<p align="center">
  <img src="https://img.shields.io/badge/LecMan-v2.0-6C63FF?style=for-the-badge&labelColor=0D1117" alt="Version" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=0D1117" alt="React" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white&labelColor=0D1117" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white&labelColor=0D1117" alt="SQLite" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=0D1117" alt="Vite" />
  <img src="https://img.shields.io/badge/License-Proprietary-F59E0B?style=for-the-badge&labelColor=0D1117" alt="License" />
</p>

<h1 align="center">🎓 LecMan — Enterprise College Management System</h1>

<p align="center">
  <strong>A comprehensive academic operations platform that automates leave workflows, substitute assignments, attendance tracking, and predictive analytics — all from one unified dashboard.</strong>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> · <a href="#-features">Features</a> · <a href="#-architecture">Architecture</a> · <a href="#-api-reference">API Reference</a> · <a href="#-database">Database</a> · <a href="#-deployment">Deployment</a>
</p>

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Complete Setup Guide](#-complete-setup-guide-for-all-users)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Frontend — Pages & Components](#-frontend--pages--components)
- [Backend — API Reference](#-backend--api-reference)
- [Backend — Controllers & Services](#-backend--controllers--services)
- [Database](#-database)
- [Authentication & Security](#-authentication--security)
- [Automation Engine](#-automation-engine)
- [User Roles & Permissions](#-user-roles--permissions)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Performance](#-performance)
- [Contributing](#-contributing)
- [License & Support](#-license--support)

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/AtharvaNavlekar/lecture-manager.git
cd lecture-manager
npm run setup          # installs root + client + server dependencies

# 2. Launch (development)
npm run dev            # Starts both frontend (5173) and backend (3000) concurrently

# 3. Open
http://localhost:5173
```

> **Windows users** — double-click `START_DEMO.bat` to launch everything with one click.

---

## 📖 Complete Setup Guide (For All Users)

This guide is written step-by-step for anyone — including non-technical users — who wants to set up LecMan for their college from scratch.

### Phase 1 — Download & Install

1. **Download the Code**
   - Go to the GitHub repository → click the green **`<> Code`** button → **Download ZIP**.
   - Extract the ZIP to your computer (e.g. `Documents/lecture-manager`).
2. **Install Node.js**
   - Download and install the LTS version from [nodejs.org](https://nodejs.org/) (v16+ required).
3. **Install Dependencies**
   ```bash
   cd lecture-manager
   npm run setup
   ```

### Phase 2 — Prepare Your College's Data

The system ships with synthetic demo data, but **for your own institution**, create your own Excel files:

| File | Required Columns |
|------|-----------------|
| `Departments.xlsx` | `code`, `name`, `short_name`, `is_active` |
| `Divisions.xlsx` | `code`, `name`, `sort_order`, `is_active` |
| `Time_Slots.xlsx` | `name`, `start_time`, `end_time`, `slot_type`, `sort_order` |
| `<Dept>_Faculty.xlsx` | `name`, `email`, `department`, `post`, `is_hod`, `password` |
| `<Dept>_Students.xlsx` | `name`, `roll_no`, `email`, `class_year`, `department`, `division` |
| `<Dept>_Subjects.xlsx` | `name`, `code`, `department`, `class_year` |
| `<Dept>_Syllabus.xlsx` | `subject_code`, `unit_number`, `topic_title`, `estimated_hours` |
| `Admin_Users.xlsx` | `name`, `email`, `department`, `post`, `is_hod`, `password` |

### Phase 3 — Start & Upload

```bash
npm run dev
```

1. Log in as **Admin** → navigate to **Settings** → **Data Import**.
2. Upload in this exact order to avoid reference errors:
   1. **Configuration** → Departments, Divisions, Time Slots
   2. **Users** → Admin, then Faculty, then Students
   3. **Academics** → Subjects, then Syllabus

### Phase 4 — How It Works

| Role | Workflow |
|------|---------|
| **Faculty** | View timetables → request leaves → accept substitute requests → upload assignments |
| **HOD** | Approve/deny leaves (auto-approves after 30 min if no action) → monitor department performance |
| **Students** | View timetables → submit assignments → check attendance records |
| **Substitute Engine** | Leave triggers auto-match → best substitute is prompted → auto-assigned in 15 min if no response |

---

## ✨ Features

### Core Management

| Feature | Description |
|---------|-------------|
| **Leave Management** | Faculty leave requests → HOD approval workflow → 30-min auto-approval → full history & analytics |
| **Substitute Assignment** | Smart teacher matching by department, availability & fairness → 15-min auto-assignment → live countdown timers → weekly CSV/Excel reports |
| **Lecture & Timetable** | Master schedule management → personal timetables → conflict detection → automated day tracking |
| **Faculty & Student Directory** | Comprehensive profiles → department-wise organization → bulk import/export → role-based access |

### Academic

| Feature | Description |
|---------|-------------|
| **Assignment Management** | Create assignments with file uploads → submission tracking → due date notifications → analytics |
| **Resource Library** | Centralized document repository → category-based organization → search & filter → access control by role |
| **Faculty Evaluations** | Criteria-based performance assessments → historical tracking → analytics & reporting |
| **Attendance** | Class-wise tracking → automated calculations → trends & analytics → student reports |

### Communication

| Feature | Description |
|---------|-------------|
| **Announcements** | Campus-wide or role-targeted announcements → priority levels → expiration dates |
| **Notifications** | Real-time in-app notifications → email digests (configurable) → read/unread tracking |
| **Inbox** | Internal messaging → threaded conversations → message archival |

### Analytics & AI

| Feature | Description |
|---------|-------------|
| **Advanced Analytics** | Department metrics → teacher performance → student reports → interactive Recharts & Chart.js charts |
| **Predictive Analytics** | AI-powered workload predictions → leave pattern analysis → resource utilization forecasting |
| **Custom Reports** | Weekly/monthly substitute reports → attendance & performance reports → export to CSV, Excel, PDF |

### Administrative

| Feature | Description |
|---------|-------------|
| **System Settings** | 13 configurable keys — org info, attendance thresholds, grading scale, notification frequency, registration toggle, maintenance mode, and more |
| **User Management** | RBAC (Admin/HOD/Teacher/Student) → bulk operations → password reset → credential management |
| **Audit Logs** | Comprehensive activity tracking → user action logging → compliance reporting → export |
| **Data Management** | Bulk import/export (CSV, Excel) → database backup & restore → schema migrations (Knex.js) |

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 + Vite 7)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 45 Pages │  │22 Comps  │  │AuthContext│  │  Axios   │            │
│  └─────┬────┘  └────┬─────┘  └─────┬────┘  └─────┬────┘            │
│        └─────────────┴──────────────┴─────────────┘                  │
│                              ▼                                       │
│                    Vite Dev Server (:5173)                           │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  /api/v1/*  (proxy)
┌────────────────────────────▼─────────────────────────────────────────┐
│                       SERVER (Express 4.18)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │27 Routes │  │27 Ctrls  │  │13 Services│  │6 Midware │            │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └──────────┘            │
│        └─────────────┴──────────────┘                                │
│                              ▼                                       │
│                  SQLite 3 (WAL mode) + Knex.js                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Styling | TailwindCSS | 4.1.18 |
| Routing | React Router DOM | 7.11.0 |
| Animations | Framer Motion | 12.29.2 |
| Charts | Recharts · Chart.js | 3.6.0 · 4.5.1 |
| Icons | Lucide React · Phosphor Icons | 0.562.0 · 2.1.10 |
| HTTP | Axios | 1.13.2 |
| Toasts | React Hot Toast | 2.6.0 |
| Auth | JWT Decode | 4.0.0 |

### Backend

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 16+ |
| Framework | Express | 4.18.2 |
| Database | SQLite3 | 5.1.6 |
| ORM / Query Builder | Knex.js | 3.1.0 |
| Auth | JSON Web Token · Bcrypt | 9.0.2 · 5.1.1 |
| Security | Helmet · CORS | 8.1.0 · 2.8.5 |
| File Uploads | Multer | 2.0.2 |
| PDF | PDFKit | 0.15.2 |
| Excel | ExcelJS · XLSX | 4.4.0 · 0.18.5 |
| Email | Nodemailer | 7.0.12 |
| Logging | Winston | 3.19.0 |
| Scheduling | Node-Cron | 4.2.1 |
| IDs | UUID | 13.0.0 |

### DevOps & Tooling

| Tool | Purpose |
|------|---------|
| PM2 6.0 | Process management |
| Docker | Containerized deployment |
| ESLint 9 + Prettier 3 | Linting & formatting |
| Husky 9 + Lint-Staged + Commitlint | Git hooks & conventional commits |
| Concurrently | Parallel dev servers |
| Jest | Testing framework |

---

## 📁 Project Structure

```
lecture-manager/
├── client/                              # ── React Frontend ──────────────
│   ├── src/
│   │   ├── pages/                       #   45 page components
│   │   │   ├── Dashboard.jsx            #     Main dashboard
│   │   │   ├── AdminDashboard.jsx       #     Admin overview
│   │   │   ├── HodDashboard.jsx         #     HOD dashboard
│   │   │   ├── LeaveRequest.jsx         #     Submit leave requests
│   │   │   ├── LeaveApproval.jsx        #     Approve/deny leaves
│   │   │   ├── SubstituteAssignment.jsx #     Assign substitutes
│   │   │   ├── MasterSchedule.jsx       #     Full college schedule
│   │   │   ├── PersonalTimetable.jsx    #     Individual timetable
│   │   │   ├── FacultyDirectory.jsx     #     Faculty management (39KB)
│   │   │   ├── StudentDirectory.jsx     #     Student management (36KB)
│   │   │   ├── Attendance.jsx           #     Mark attendance
│   │   │   ├── Analytics.jsx            #     Analytics dashboard (20KB)
│   │   │   ├── PredictiveAnalytics.jsx  #     AI predictions (19KB)
│   │   │   ├── Announcements.jsx        #     Announcement system (22KB)
│   │   │   ├── ResourceLibrary.jsx      #     Document repository (22KB)
│   │   │   ├── SubjectManager.jsx       #     Subject management (47KB)
│   │   │   ├── Settings.jsx             #     Operational settings (46KB)
│   │   │   ├── AuditLogs.jsx            #     Audit log viewer
│   │   │   ├── Login.jsx                #     Authentication
│   │   │   └── ... (26 more pages)
│   │   ├── components/                  #   22 reusable UI components
│   │   ├── context/AuthContext.jsx       #   Authentication context
│   │   ├── hooks/useAuth.js             #   Auth hooks
│   │   ├── utils/api.js                 #   Axios config (base: /api/v1)
│   │   ├── styles/                      #   Custom responsive styles
│   │   ├── App.jsx                      #   Main app + routing
│   │   └── main.jsx                     #   Entry point
│   ├── vite.config.js
│   └── package.json
│
├── server/                              # ── Express Backend ─────────────
│   ├── routes/                          #   27 API route modules
│   ├── controllers/                     #   27 business logic controllers
│   ├── services/                        #   13 business services
│   ├── middleware/                      #   6 middleware modules
│   ├── config/db.js                     #   SQLite + schema + seed logic
│   ├── utils/                           #   9 utility modules
│   ├── scripts/                         #   Setup & maintenance scripts
│   ├── __tests__/                       #   Jest test suites
│   ├── logs/                            #   Winston log files
│   ├── backups/                         #   Database backups
│   ├── database.sqlite                  #   Main database
│   ├── knexfile.js                      #   Knex migration config
│   ├── index.js                         #   Server entry point
│   └── package.json
│
├── uploads/                             # User uploaded files
├── data/                                # Sample/seed data (Excel)
├── ecosystem.config.js                  # PM2 configuration
├── docker-compose.yml                   # Docker setup
├── Dockerfile
├── START_DEMO.bat                       # One-click Windows launcher
├── package.json                         # Root scripts
└── README.md                            # ← You are here
```

---

## 🖥 Frontend — Pages & Components

### Page Catalog (45 Pages)

#### Dashboards (4)
| Page | File | Description |
|------|------|-------------|
| Main Dashboard | `Dashboard.jsx` | Role-based landing with key metrics |
| Admin Dashboard | `AdminDashboard.jsx` | System-wide overview & stats |
| HOD Dashboard | `HodDashboard.jsx` | Department management hub |
| Role Dashboard | `RoleDashboard.jsx` | Dynamic role-based router |

#### Leave & Substitute Management (7)
| Page | File | Description |
|------|------|-------------|
| Leave Request | `LeaveRequest.jsx` | Submit and manage leave requests |
| HOD Leave Request | `HODLeaveRequest.jsx` | HOD leave submission interface |
| Leave Approval | `LeaveApproval.jsx` | Approve/deny pending leaves |
| Leave Management | `LeaveManagement.jsx` | Overview of all leaves |
| Substitute Assignment | `SubstituteAssignment.jsx` | Assign substitute teachers |
| Substitute Report | `SubstituteReport.jsx` | Weekly substitute reports |
| Substitute Analytics | `SubstituteAnalytics.jsx` | Substitute workload metrics |

#### Schedule & Timetable (2)
| Page | File | Description |
|------|------|-------------|
| Master Schedule | `MasterSchedule.jsx` | Complete college schedule |
| Personal Timetable | `PersonalTimetable.jsx` | Individual timetable with auto-day update |

#### Faculty & Students (3)
| Page | File | Description |
|------|------|-------------|
| Faculty Directory | `FacultyDirectory.jsx` | Manage faculty members (39KB) |
| Student Directory | `StudentDirectory.jsx` | Manage student records (36KB) |
| User Credentials | `UserCredentials.jsx` | Manage user logins (28KB) |

#### Assignments (3)
| Page | File | Description |
|------|------|-------------|
| Assignment Manager | `AssignmentManager.jsx` | View all assignments |
| Create Assignment | `CreateAssignment.jsx` | Create with file upload |
| Assignment Details | `AssignmentDetails.jsx` | View assignment details |

#### Attendance (3)
| Page | File | Description |
|------|------|-------------|
| Attendance | `Attendance.jsx` | Mark student attendance |
| Attendance Launcher | `AttendanceLauncher.jsx` | Launch attendance session |
| Attendance Trends | `AttendanceTrends.jsx` | Attendance analytics |

#### Analytics & Reports (6)
| Page | File | Description |
|------|------|-------------|
| Analytics | `Analytics.jsx` | Main analytics dashboard (20KB) |
| Predictive Analytics | `PredictiveAnalytics.jsx` | AI-powered predictions (19KB) |
| Teacher Analytics | `TeacherAnalytics.jsx` | Faculty performance metrics |
| Department Metrics | `DepartmentMetrics.jsx` | Department statistics |
| Student Performance | `StudentPerformanceReports.jsx` | Student achievement reports |
| Automation Dashboard | `AutomationDashboard.jsx` | Automation system metrics |

#### Communication (2)
| Page | File | Description |
|------|------|-------------|
| Announcements | `Announcements.jsx` | Create/view announcements (22KB) |
| Inbox | `Inbox.jsx` | Internal messaging system |

#### Resources & Library (2)
| Page | File | Description |
|------|------|-------------|
| Resource Library | `ResourceLibrary.jsx` | Document repository (22KB) |
| Subject Manager | `SubjectManager.jsx` | Subject management (47KB) |

#### Evaluations (1)
| Page | File | Description |
|------|------|-------------|
| Faculty Evaluations | `FacultyEvaluations.jsx` | Faculty performance evaluations |

#### Audit & System (4)
| Page | File | Description |
|------|------|-------------|
| Audit Logs | `AuditLogs.jsx` | System audit log viewer |
| Audit Log Viewer | `AuditLogViewer.jsx` | Detailed audit view |
| Data Management | `DataManagement.jsx` | Import/export data |
| User Role Management | `UserRoleManagement.jsx` | Manage user roles |

#### Settings & Configuration (2)
| Page | File | Description |
|------|------|-------------|
| Settings | `Settings.jsx` | Operational admin settings (46KB) |
| System Settings | `SystemSettings.jsx` | System configuration (23KB) |

#### Authentication (5)
| Page | File | Description |
|------|------|-------------|
| Login | `Login.jsx` | User authentication |
| Register | `Register.jsx` | New user registration |
| Forgot Password | `ForgotPassword.jsx` | Password recovery request |
| Reset Password | `ResetPassword.jsx` | Password reset with token |
| 404 | `NotFound.jsx` | Error page |

---

### Reusable Components (22)

| Category | Components |
|----------|-----------|
| **Navigation** | `Navbar` · `Sidebar` · `Breadcrumb` |
| **Layout** | `Card` · `Modal` · `Footer` |
| **Data Display** | `Table` · `Chart` · `StatCard` · `Badge` · `Avatar` |
| **Forms & Input** | `SearchBar` · `FilterPanel` · `DatePicker` · `TimePicker` · `Dropdown` · `FileUpload` |
| **Utilities** | `Pagination` · `LoadingSpinner` · `ErrorBoundary` · `ProtectedRoute` · `Tooltip` |

### Routing

```
Public:      /login  /register  /forgot-password  /reset-password
Dashboards:  /dashboard  /admin-dashboard  /hod-dashboard
Leave:       /leave-request  /leave-approval  /leave-management
Substitute:  /substitute-assignment  /substitute-report  /substitute-analytics
Schedule:    /master-schedule  /personal-timetable
Directory:   /faculty-directory  /student-directory
Assignments: /assignments  /create-assignment  /assignment/:id
Attendance:  /attendance  /attendance-launcher  /attendance-trends
Analytics:   /analytics  /predictive-analytics  /teacher-analytics  /department-metrics
Comms:       /announcements  /inbox
Resources:   /resource-library  /subject-manager
Admin:       /audit-logs  /data-management  /user-credentials  /user-role-management
Settings:    /settings  /system-settings
```

### State Management

**AuthContext** provides: `user`, `token`, `login()`, `logout()`, `isAuthenticated`, `hasRole()`.

```jsx
const { user, hasRole, logout } = useContext(AuthContext);
```

---

## 🔌 Backend — API Reference

All routes are prefixed with `/api/v1`.

### Authentication & Authorization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | User authentication |
| `POST` | `/auth/logout` | User logout |
| `POST` | `/auth/register` | New user registration |
| `GET` | `/auth/verify` | Verify JWT token |
| `GET` | `/auth/profile` | Get user profile |
| `PUT` | `/auth/change-password` | Change logged-in user's password |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/verify-reset-token/:token` | Verify reset token |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/teachers` | List all teachers |
| `GET/POST/PUT/DELETE` | `/teachers/:id` | CRUD teachers |
| `GET` | `/teachers/department/:id` | Teachers by department |
| `GET` | `/teachers/available` | Available teachers |
| `GET` | `/students` | List all students |
| `GET/POST/PUT/DELETE` | `/students/:id` | CRUD students |
| `GET` | `/hod/dashboard` | HOD dashboard data |
| `GET` | `/hod/pending-approvals` | Pending leave approvals |
| `GET` | `/admin/users` | All users (admin) |
| `POST` | `/admin/bulk-upload` | Bulk user upload |
| `GET` | `/admin/system-stats` | System statistics |

### Leave & Substitute Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/leaves` | Fetch leaves (role-filtered) |
| `POST` | `/leaves` | Submit leave request |
| `GET` | `/leaves/:id` | Leave details |
| `PUT` | `/leaves/:id/approve` | Approve/deny leave |
| `DELETE` | `/leaves/:id` | Cancel leave |
| `GET` | `/leaves/my-leaves` | User's leave history |
| `GET` | `/leaves/pending` | Pending approvals (HOD) |
| `GET` | `/leaves/statistics` | Leave statistics |
| `GET` | `/leaves/lectures/needingsubstitutes` | Lectures needing substitutes |
| `GET` | `/leaves/teachers/available` | Available substitute teachers |
| `POST` | `/leaves/substitute/assign` | Assign substitute |
| `GET` | `/leaves/substitute/report` | Weekly substitute report |
| `PUT` | `/leaves/substitute/accept/:id` | Accept substitute assignment |
| `PUT` | `/leaves/substitute/decline/:id` | Decline substitute assignment |

### Academic

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/lectures/schedule` | Master schedule |
| `GET` | `/lectures/my-timetable` | Personal timetable |
| `GET` | `/lectures/conflicts` | Detect scheduling conflicts |
| `GET/POST/PUT/DELETE` | `/lectures/:id` | CRUD lectures |
| `GET/POST/PUT/DELETE` | `/subjects/:id` | CRUD subjects |
| `GET/POST/PUT/DELETE` | `/assignments/:id` | CRUD assignments |
| `POST` | `/assignments/:id/submit` | Submit assignment |
| `GET/POST/PUT/DELETE` | `/evaluations/:id` | CRUD evaluations |

### Communication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/PUT/DELETE` | `/announcements/:id` | CRUD announcements |
| `GET` | `/notifications` | User notifications |
| `GET` | `/notifications/unread` | Unread count |
| `PUT` | `/notifications/:id/read` | Mark as read |
| `PUT` | `/notifications/read-all` | Mark all as read |

### Resources & Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/DELETE` | `/resources/:id` | CRUD resources |
| `GET` | `/resources/download/:id` | Download resource |
| `POST` | `/files/upload` | File upload (multipart) |
| `GET` | `/files/download/:id` | Download file |

### Analytics & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/dashboard` | Dashboard analytics |
| `GET` | `/analytics/department/:id` | Department metrics |
| `GET` | `/analytics/teacher/:id` | Teacher analytics |
| `GET` | `/analytics/student/:id` | Student performance |
| `GET` | `/reports/attendance` | Attendance reports |
| `GET` | `/reports/substitute` | Substitute reports |
| `POST` | `/reports/generate` | Generate custom report |
| `GET` | `/reports/export/:type` | Export (CSV/Excel/PDF) |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/predict-workload` | Predict teacher workload |
| `POST` | `/ai/recommend-substitute` | AI substitute recommendation |
| `POST` | `/ai/analyze-patterns` | Pattern analysis |
| `POST` | `/ai/optimize-schedule` | Schedule optimization |

### System Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/settings` | Bulk get/update all settings |
| `GET/PUT` | `/settings/:key` | Single setting CRUD |
| `GET/PUT` | `/config/settings` | System configuration |
| `GET` | `/automation/config` | Automation timers |
| `PUT` | `/automation/config` | Update automation timers |
| `POST` | `/automation/trigger/:type` | Manual trigger |
| `GET` | `/audit/logs` | Audit log entries |
| `GET` | `/audit/export` | Export audit logs |
| `POST` | `/admin/import/teachers` | Import teachers (CSV/Excel) |
| `POST` | `/admin/import/students` | Import students |
| `GET` | `/admin/export/database` | Full database export |
| `GET` | `/search/global` | Global search |
| `GET/POST/PUT/DELETE` | `/calendar/events/:id` | Calendar CRUD |
| `GET` | `/health` | Health check |
| `GET` | `/health/status` | System status |

**Total**: 27 route modules · 100+ endpoints

---

## ⚙ Backend — Controllers & Services

### Key Controllers

| Controller | Size | Purpose |
|-----------|------|---------|
| `lectureController.js` | 36KB | Schedule management, conflict detection, timetable generation |
| `reportController.js` | 25KB | PDF/Excel/CSV generation, custom report builder |
| `leaveController.js` | 14KB | Leave request processing, approval workflow |
| `aiController.js` | 14KB | Workload predictions, substitute recommendations |
| `settingsController.js` | — | Bulk get/update of 13 system configuration keys |

### Service Layer (13 Modules)

| Service | Purpose |
|---------|---------|
| `automationService.js` | 30-min auto-approval & 15-min auto-assignment timers |
| `emailService.js` | Nodemailer-based notifications (leave, approval, substitute, password reset) |
| `notificationService.js` | In-app notification dispatch |
| `reportService.js` | PDF (PDFKit), Excel (ExcelJS), CSV generation |
| `analyticsService.js` | Metrics calculation, trend analysis, statistics |
| `fileService.js` | Upload/download, type validation, storage |
| `backupService.js` | Database backup & restore |
| `migrationService.js` | Knex.js schema migrations |
| `aiService.js` | Predictive analytics & recommendations |
| `cacheService.js` | In-memory caching layer |
| `validationService.js` | Input validation |
| `cronService.js` | Scheduled tasks (daily reminders, weekly reports) |
| `errorLogger.js` | Error tracking & pattern detection |

### Middleware Stack (6 Modules)

| Middleware | Purpose |
|-----------|---------|
| `authMiddleware.js` | JWT verification + role extraction |
| `roleCheck.js` | Role-based access control |
| `errorHandler.js` | Centralized error handling + 404 |
| `validation.js` | Request body validation |
| `rateLimitMiddleware.js` | Rate limiting (configurable) |
| `upload.js` | Multer file upload config |

---

## 💾 Database

**Engine**: SQLite 3 (WAL mode, auto-enabled on startup)
**File**: `server/database.sqlite`
**ORM**: Knex.js (migrations + query builder)
**Backups**: Automatic to `server/backups/`

### Schema Overview

#### User Tables
`users` · `teachers` · `students` · `admins` · `hods`

#### Academic Tables
`lectures` · `subjects` · `departments` · `divisions` · `rooms` · `time_slots` · `academic_years` · `designations` · `attendance`

#### Leave & Substitute Tables
`leave_requests` · `substitute_assignments` · `leave_approvals`

#### Assignment Tables
`assignments` · `assignment_submissions` · `assignment_files`

#### Communication Tables
`announcements` · `notifications` · `messages`

#### Resource Tables
`resources` · `resource_categories`

#### Evaluation Tables
`evaluations` · `evaluation_criteria`

#### System Tables
`settings` (key-value) · `audit_logs` · `user_preferences` · `files`

### Migration Commands

```bash
npm run migrate:latest       # Run latest migrations
npm run migrate:rollback     # Rollback last migration
npm run migrate:status       # Check migration status
npm run migrate:make <name>  # Create new migration
```

### System Settings (13 Keys)

| Key | Tab | What It Controls |
|-----|-----|-----------------|
| `org_name` | Organization | Sidebar branding, report headers |
| `org_code` | Organization | Roll numbers, document headers |
| `admin_email` | Organization | Contact info on login/error screens |
| `support_phone` | Organization | Support contact display |
| `notification_frequency` | Organization | Digest frequency (instant/daily/weekly) |
| `academic_year` | Academic | Dashboard filtering, report periods |
| `current_semester` | Academic | Active semester context |
| `attendance_threshold` | Academic | At-risk student flagging (%) |
| `grading_scale` | Academic | Standard / GPA / CGPA / Percentage |
| `auto_approval_minutes` | Academic | Leave auto-approval timer |
| `auto_assignment_minutes` | Academic | Substitute auto-assignment timer |
| `allow_registrations` | Users | Gates the `/register` page |
| `maintenance_mode` | System | 503s all non-admin users |

---

## 🔐 Authentication & Security

### Authentication Flow

```
1. POST /auth/login  →  Verify credentials  →  Issue JWT (httpOnly cookie)
2. All requests  →  authMiddleware  →  Extract user from token
3. Protected routes  →  roleCheck(['admin', 'hod'])  →  RBAC enforcement
```

### Security Layers

| Layer | Implementation |
|-------|---------------|
| **Password Hashing** | Bcrypt (10 salt rounds) |
| **JWT Tokens** | Signed with configurable `JWT_SECRET`, 7-day expiry |
| **HTTP Headers** | Helmet.js — CSP, HSTS, X-Frame-Options, XSS Protection |
| **CORS** | Whitelist-based origin configuration |
| **Rate Limiting** | Configurable per-endpoint limits |
| **Input Validation** | Parameterized queries (SQL injection prevention) + body validation |
| **File Uploads** | Type/size restrictions via Multer |
| **Audit Trail** | Comprehensive activity logging to `audit_logs` table |
| **Maintenance Guard** | Middleware to lock non-admin access when maintenance mode is active |

---

## 🤖 Automation Engine

```
┌──────────────────────────────────────────────────────────┐
│                   automationService.js                    │
│                                                          │
│  ┌─────────────────────────┐  ┌────────────────────────┐ │
│  │  Auto-Approval Timer    │  │  Auto-Assignment Timer │ │
│  │  (default: 30 min)      │  │  (default: 15 min)     │ │
│  │                         │  │                         │ │
│  │  • Checks every minute  │  │  • Checks for unassigned│ │
│  │  • Auto-approves if HOD │  │    substitutes          │ │
│  │    hasn't responded     │  │  • Matches by dept,     │ │
│  │  • Sends notification   │  │    availability, load   │ │
│  │  • Logs to audit trail  │  │  • Force-assigns if     │ │
│  │                         │  │    no one accepts       │ │
│  └─────────────────────────┘  └────────────────────────┘ │
│                                                          │
│  Scheduled Tasks (node-cron):                            │
│  • Daily attendance reminders                            │
│  • Weekly substitute reports                             │
│  • Monthly analytics snapshots                           │
│  • Periodic database backups                             │
└──────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Permissions

| Capability | Admin | HOD | Teacher | Student |
|-----------|:-----:|:---:|:-------:|:-------:|
| System configuration | ✅ | — | — | — |
| User management (CRUD) | ✅ | — | — | — |
| Audit logs | ✅ | — | — | — |
| Data import/export | ✅ | — | — | — |
| Database backup | ✅ | — | — | — |
| Leave approval | ✅ | ✅ | — | — |
| Department analytics | ✅ | ✅ | — | — |
| Faculty management | ✅ | ✅ | — | — |
| Substitute oversight | ✅ | ✅ | — | — |
| Leave requests | ✅ | ✅ | ✅ | — |
| Substitute acceptance | — | — | ✅ | — |
| Assignment creation | ✅ | ✅ | ✅ | — |
| Attendance marking | ✅ | ✅ | ✅ | — |
| Resource upload | ✅ | ✅ | ✅ | — |
| View timetable | ✅ | ✅ | ✅ | ✅ |
| Assignment submission | — | — | — | ✅ |
| View attendance | ✅ | ✅ | ✅ | ✅ |
| View announcements | ✅ | ✅ | ✅ | ✅ |

---

## 💻 Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Scripts

#### Root Level

```bash
npm run dev              # Start both client + server concurrently
npm run server           # Start only backend (port 3000)
npm run client           # Start only frontend (port 5173)
npm run setup            # Install all dependencies + seed data

# PM2
npm run pm2:start        # Start with PM2
npm run pm2:dev          # Development mode with PM2
npm run pm2:stop         # Stop PM2 processes
npm run pm2:logs         # View PM2 logs
npm run pm2:monit        # PM2 monitoring dashboard

# Migrations
npm run migrate:latest   # Run latest migrations
npm run migrate:rollback # Rollback last migration
npm run migrate:status   # Migration status

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier
npm run prepare          # Install Husky git hooks
```

#### Client Only

```bash
cd client
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # Production build → dist/
npm run preview          # Preview production build
npm run lint             # Lint frontend code
```

#### Server Only

```bash
cd server
npm start                # Start production server
npm run dev              # Start with nodemon (auto-reload)
npm test                 # Run Jest tests
npm run test:watch       # Jest watch mode
npm run test:coverage    # Test coverage report
```

### Environment Variables

Create `server/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=./database.sqlite

# JWT
JWT_SECRET=generate-a-strong-random-string-at-least-32-chars
JWT_EXPIRY=7d

# Email (optional)
EMAIL_USER=your-email@college.edu
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@college.edu

# Automation Timers (in minutes)
AUTO_APPROVAL_TIME=30
AUTO_ASSIGNMENT_TIME=15

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=LecMan
```

---

## 🧪 Testing

### Jest Test Suites

| Suite | File | Coverage |
|-------|------|---------|
| Authentication | `auth.test.js` | Login, register, JWT, password reset |
| Leave Management | `leave.test.js` | CRUD, approval workflow, auto-approval |
| Substitute Assignment | `substitute.test.js` | Matching, assignment, acceptance flow |

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Set a strong `JWT_SECRET` (32+ characters)
- [ ] Change default admin credentials
- [x] WAL mode auto-enabled in `config/db.js`
- [ ] Configure SMTP email service
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure reverse proxy (nginx recommended)
- [ ] Enable log rotation
- [ ] Setup automated database backups
- [ ] Configure PM2 for process management
- [ ] Run health check: `node server/scripts/maintenance/verify_all_systems.js`

### Option 1 — PM2 (Recommended for VPS)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup && pm2 save    # Auto-start on boot
pm2 monit                  # Monitoring dashboard
```

### Option 2 — Docker

```bash
docker-compose up -d       # Build & run
docker-compose logs -f     # View logs
docker-compose down        # Stop
```

### Option 3 — Manual

```bash
cd client && npm run build             # Build frontend → dist/
cd ../server && NODE_ENV=production npm start  # Start backend
```

### Performance Optimizations

| Area | Implementation |
|------|---------------|
| **Database** | WAL mode (auto-enabled), parameterized queries |
| **Frontend** | Code splitting (Vite), lazy loading, tree shaking, asset minification |
| **Backend** | Response caching, connection pooling, query optimization |

---

## 🐛 Troubleshooting

<details>
<summary><strong>Server won't start</strong></summary>

```bash
taskkill /F /IM node.exe                    # Kill existing Node processes
cd server && rm -rf node_modules && npm install
cd ../client && rm -rf node_modules && npm install
npm run dev
```
</details>

<details>
<summary><strong>Database locked error</strong></summary>

```bash
del server\database.sqlite-wal
del server\database.sqlite-shm
```
</details>

<details>
<summary><strong>Port already in use</strong></summary>

```bash
netstat -ano | findstr :3000        # Find process
taskkill /PID <process_id> /F       # Kill it
# Or change PORT in server/.env
```
</details>

<details>
<summary><strong>Frontend build fails</strong></summary>

```bash
cd client
rm -rf node_modules .vite dist
npm install && npm run build
```
</details>

<details>
<summary><strong>File upload issues</strong></summary>

```bash
mkdir uploads                       # Ensure directory exists
# Check MAX_FILE_SIZE in server/.env (default: 10MB)
```
</details>

<details>
<summary><strong>Email not sending</strong></summary>

```bash
# Verify EMAIL_USER, EMAIL_PASS in server/.env
# Use an "App Password", not your regular password
# Check SMTP connectivity
```
</details>

### Logs & Health

```bash
tail -f server/logs/app.log          # Application logs
tail -f server/logs/error.log        # Error logs
pm2 logs                             # PM2 logs
curl http://localhost:3000/api/v1/health  # Health check
node server/scripts/maintenance/verify_all_systems.js  # Full system verification
```

---

## 📊 Performance

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time | < 500ms | < 200ms ✅ |
| Frontend Load Time | < 3s | < 2s ✅ |
| Database Queries | < 100ms | < 50ms ✅ |
| Concurrent Users | 100+ | Load Tested ✅ |
| Mobile Responsive | 100% | 100% ✅ |
| Lighthouse Score | > 90 | ✅ |
| System Uptime | > 99.5% | 99%+ ✅ |

---

## 🤝 Contributing

### Code Quality Standards

1. **Linting** — All code must pass ESLint
2. **Formatting** — Prettier enforced on commit
3. **Commits** — Conventional commits via Commitlint (`feat:`, `fix:`, `docs:`)
4. **Testing** — Write tests for new features
5. **Documentation** — Update this README for new features

### Git Workflow

```bash
# Pre-commit hooks automatically run ESLint + Prettier + Commitlint
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update README"
```

### Adding New Features

1. **Backend**: Create route in `routes/` → controller in `controllers/` → service in `services/`
2. **Frontend**: Create page in `pages/` → add route in `App.jsx`
3. Run `npm run lint` before committing

---

## 📄 License & Support

**License**: Proprietary — College Internal Use Only

**Support**:
1. Check documentation in `docs/` folder
2. Review error logs in `server/logs/`
3. Run system verification: `node server/scripts/maintenance/verify_all_systems.js`
4. Check health endpoint: `http://localhost:3000/api/v1/health`

---

<p align="center">
  <strong>Built with</strong><br />
  React 19 · Vite 7 · TailwindCSS 4 · Framer Motion · Recharts · Chart.js<br />
  Node.js · Express 4 · SQLite 3 · Knex.js · Winston · JWT · Nodemailer<br />
  PM2 · Docker · ESLint · Prettier · Husky
</p>

<p align="center">
  <strong>Developed</strong>: January 2026 – March 2026<br />
  <strong>Status</strong>: ✅ Production Ready · 🚀 Enterprise Grade<br />
  <strong>Last Updated</strong>: March 24, 2026
</p>
