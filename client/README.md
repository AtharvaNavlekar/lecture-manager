# 🎨 Lecture Manager - Frontend Application

**Framework**: React 19.2.0  
**Build Tool**: Vite 7.2.4  
**Styling**: TailwindCSS 4.1.18  
**Last Updated**: February 9, 2026

## Overview

The Lecture Manager frontend is a modern, responsive React application built with Vite and styled with TailwindCSS 4. It provides an intuitive interface for managing academic operations including leave requests, substitute assignments, analytics, resource management, and more.

### Key Features
- 🎨 Modern UI with TailwindCSS 4 and custom responsive design
- ✨ Smooth animations with Framer Motion and Lottie
- 📊 Interactive charts and analytics with Recharts and Chart.js
- 📱 Fully responsive design for mobile, tablet, and desktop
- 🔒 Role-based access control with JWT authentication
- ⚡ Fast performance with Vite's HMR and code splitting
- 🎯 Comprehensive routing with React Router DOM 7
- 🔔 Real-time notifications with React Hot Toast

---

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Pages Overview](#pages-overview)
- [Components](#components)
- [Routing](#routing)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Development](#development)
- [Build & Deployment](#build--deployment)

---

## 🛠️ Technology Stack

### Core
- **React**: 19.2.0 - UI library
- **Vite**: 7.2.4 - Build tool and dev server
- **React Router DOM**: 7.11.0 - Client-side routing

### Styling
- **TailwindCSS**: 4.1.18 - Utility-first CSS framework
- **@tailwindcss/vite**: 4.1.18 - Vite plugin for TailwindCSS
- **@tailwindcss/postcss**: 4.1.18 - PostCSS integration
- **Custom CSS**: Responsive styles in `src/styles/`

### UI Components & Icons
- **Lucide React**: 0.562.0 - Icon library
- **Phosphor Icons**: 2.1.10 - Additional icons
- **Lottie React**: 2.4.1 - Animation library

### Animations
- **Framer Motion**: 12.29.2 - Animation library for React

### Data Visualization
- **Recharts**: 3.6.0 - Composable charting library
- **Chart.js**: 4.5.1 - JavaScript charting library
- **React Chartjs-2**: 5.3.1 - React wrapper for Chart.js

### HTTP & State
- **Axios**: 1.13.2 - HTTP client
- **React Context API**: Built-in state management

### Authentication
- **JWT Decode**: 4.0.0 - Decode JWT tokens

### Notifications
- **React Hot Toast**: 2.6.0 - Toast notifications

### Development Tools
- **ESLint**: 9.39.1 - Linting
- **@vitejs/plugin-react**: 5.1.1 - React plugin for Vite
- **PostCSS**: 8.5.6 - CSS processing
- **Autoprefixer**: 10.4.23 - CSS vendor prefixing

---

## 📁 Project Structure

```
client/
├── src/
│   ├── pages/                      # 45 Page Components
│   │   ├── Dashboard Pages
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   ├── AdminDashboard.jsx     # Admin overview
│   │   │   ├── HodDashboard.jsx       # HOD dashboard
│   │   │   └── RoleDashboard.jsx      # Role-based dashboard
│   │   │
│   │   ├── Leave & Substitute Management
│   │   │   ├── LeaveRequest.jsx        # Submit leave requests
│   │   │   ├── HODLeaveRequest.jsx     # HOD leave interface
│   │   │   ├── LeaveApproval.jsx       # Approve/deny leaves
│   │   │   ├── LeaveManagement.jsx     # Leave overview
│   │   │   ├── SubstituteAssignment.jsx # Assign substitutes
│   │   │   ├── SubstituteReport.jsx    # Substitute reports
│   │   │   └── SubstituteAnalytics.jsx # Substitute metrics
│   │   │
│   │   ├── Schedule & Timetable
│   │   │   ├── MasterSchedule.jsx      # Full college schedule
│   │   │   └── PersonalTimetable.jsx   # Personal timetable
│   │   │
│   │   ├── Faculty & Students
│   │   │   ├── FacultyDirectory.jsx     # Faculty management (39KB)
│   │   │   ├── StudentDirectory.jsx     # Student management (36KB)
│   │   │   └── UserCredentials.jsx      # User credentials (28KB)
│   │   │
│   │   ├── Assignments
│   │   │   ├── AssignmentManager.jsx   # Assignment overview
│   │   │   ├── CreateAssignment.jsx    # Create new assignment
│   │   │   └── AssignmentDetails.jsx   # View assignment details
│   │   │
│   │   ├── Attendance
│   │   │   ├── Attendance.jsx          # Mark attendance
│   │   │   ├── AttendanceLauncher.jsx  # Launch attendance
│   │   │   └── AttendanceTrends.jsx    # Attendance analytics
│   │   │
│   │   ├── Analytics & Reports
│   │   │   ├── Analytics.jsx                    # Main analytics (20KB)
│   │   │   ├── PredictiveAnalytics.jsx          # AI predictions (19KB)
│   │   │   ├── TeacherAnalytics.jsx             # Teacher metrics
│   │   │   ├── DepartmentMetrics.jsx            # Department stats
│   │   │   ├── StudentPerformanceReports.jsx    # Student reports
│   │   │   └── AutomationDashboard.jsx          # Automation metrics
│   │   │
│   │   ├── Communication
│   │   │   ├── Announcements.jsx       # Announcements (22KB)
│   │   │   └── Inbox.jsx               # Internal messaging
│   │   │
│   │   ├── Resources & Library
│   │   │   ├── ResourceLibrary.jsx     # Document repository (22KB)
│   │   │   └── SubjectManager.jsx      # Subject management (47KB)
│   │   │
│   │   ├── Evaluations
│   │   │   └── FacultyEvaluations.jsx  # Faculty evaluations
│   │   │
│   │   ├── Audit & System
│   │   │   ├── AuditLogs.jsx           # Audit log viewer
│   │   │   ├── AuditLogViewer.jsx      # Detailed audit view
│   │   │   ├── DataManagement.jsx      # Data import/export
│   │   │   └── UserRoleManagement.jsx  # Role management
│   │   │
│   │   ├── Settings & Configuration
│   │   │   ├── Settings.jsx            # User settings (23KB)
│   │   │   └── SystemSettings.jsx      # System configuration (23KB)
│   │   │
│   │   └── Authentication
│   │       ├── Login.jsx               # User login
│   │       ├── Register.jsx            # User registration
│   │       ├── ForgotPassword.jsx      # Password recovery
│   │       ├── ResetPassword.jsx       # Password reset
│   │       └── NotFound.jsx            # 404 page
│   │
│   ├── components/                 # 22 Reusable Components
│   │   ├── Navbar.jsx              # Top navigation bar
│   │   ├── Sidebar.jsx             # Side navigation
│   │   ├── Footer.jsx              # Footer component
│   │   ├── Card.jsx                # Card wrapper
│   │   ├── Modal.jsx               # Modal dialogs
│   │   ├── Table.jsx               # Data table
│   │   ├── Pagination.jsx          # Pagination controls
│   │   ├── SearchBar.jsx           # Search input
│   │   ├── FilterPanel.jsx         # Filter controls
│   │   ├── LoadingSpinner.jsx      # Loading indicator
│   │   ├── ErrorBoundary.jsx       # Error handling
│   │   ├── ProtectedRoute.jsx      # Auth guard
│   │   ├── StatCard.jsx            # Statistics card
│   │   ├── Chart.jsx               # Chart wrapper
│   │   ├── FileUpload.jsx          # File upload component
│   │   ├── DatePicker.jsx          # Date selection
│   │   ├── TimePicker.jsx          # Time selection
│   │   ├── Dropdown.jsx            # Dropdown menu
│   │   ├── Badge.jsx               # Status badges
│   │   ├── Avatar.jsx              # User avatar
│   │   ├── Breadcrumb.jsx          # Breadcrumb navigation
│   │   └── Tooltip.jsx             # Tooltip component
│   │
│   ├── context/
│   │   └── AuthContext.jsx         # Authentication context
│   │
│   ├── hooks/
│   │   └── useAuth.js              # Authentication hook
│   │
│   ├── services/
│   │   └── api.js                  # Axios API configuration
│   │
│   ├── utils/
│   │   ├── formatters.js           # Data formatting utilities
│   │   ├── validators.js           # Input validation
│   │   └── constants.js            # Application constants
│   │
│   ├── styles/
│   │   └── responsive.css          # Custom responsive styles
│   │
│   ├── assets/
│   │   ├── images/                 # Image assets
│   │   ├── animations/             # Lottie animations
│   │   └── fonts/                  # Custom fonts
│   │
│   ├── App.jsx                     # Main app component with routing
│   ├── App.css                     # App-level styles
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
│
├── public/
│   └── vite.svg                    # Vite logo
│
├── index.html                      # HTML template
├── vite.config.js                  # Vite configuration
├── eslint.config.js                # ESLint configuration
├── postcss.config.js               # PostCSS configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## 📄 Pages Overview

### Dashboard Pages (4)
| Page | File | Description |
|------|------|-------------|
| Main Dashboard | `Dashboard.jsx` | Role-based dashboard landing |
| Admin Dashboard | `AdminDashboard.jsx` | Admin overview with system stats |
| HOD Dashboard | `HodDashboard.jsx` | Department management dashboard |
| Role Dashboard | `RoleDashboard.jsx` | Dynamic role-based routing |

### Leave & Substitute Management (7)
| Page | File | Description |
|------|------|-------------|
| Leave Request | `LeaveRequest.jsx` | Submit and manage leave requests |
| HOD Leave Request | `HODLeaveRequest.jsx` | HOD leave submission interface |
| Leave Approval | `LeaveApproval.jsx` | Approve/deny pending leaves |
| Leave Management | `LeaveManagement.jsx` | Overview of all leaves |
| Substitute Assignment | `SubstituteAssignment.jsx` | Assign substitute teachers |
| Substitute Report | `SubstituteReport.jsx` | Weekly substitute reports |
| Substitute Analytics | `SubstituteAnalytics.jsx` | Substitute workload metrics |

### Schedule & Timetable (2)
| Page | File | Description |
|------|------|-------------|
| Master Schedule | `MasterSchedule.jsx` | Complete college schedule |
| Personal Timetable | `PersonalTimetable.jsx` | Individual timetable with auto-day update |

### Faculty & Students (3)
| Page | File | Description |
|------|------|-------------|
| Faculty Directory | `FacultyDirectory.jsx` | Manage faculty members |
| Student Directory | `StudentDirectory.jsx` | Manage student records |
| User Credentials | `UserCredentials.jsx` | Manage user logins |

### Assignments (3)
| Page | File | Description |
|------|------|-------------|
| Assignment Manager | `AssignmentManager.jsx` | View all assignments |
| Create Assignment | `CreateAssignment.jsx` | Create new assignment with file upload |
| Assignment Details | `AssignmentDetails.jsx` | View assignment details |

### Attendance (3)
| Page | File | Description |
|------|------|-------------|
| Attendance | `Attendance.jsx` | Mark student attendance |
| Attendance Launcher | `AttendanceLauncher.jsx` | Launch attendance session |
| Attendance Trends | `AttendanceTrends.jsx` | Attendance analytics |

### Analytics & Reports (6)
| Page | File | Description |
|------|------|-------------|
| Analytics | `Analytics.jsx` | Main analytics dashboard |
| Predictive Analytics | `PredictiveAnalytics.jsx` | AI-powered predictions |
| Teacher Analytics | `TeacherAnalytics.jsx` | Faculty performance metrics |
| Department Metrics | `DepartmentMetrics.jsx` | Department statistics |
| Student Performance | `StudentPerformanceReports.jsx` | Student achievement reports |
| Automation Dashboard | `AutomationDashboard.jsx` | Automation system metrics |

### Communication (2)
| Page | File | Description |
|------|------|-------------|
| Announcements | `Announcements.jsx` | Create and view announcements |
| Inbox | `Inbox.jsx` | Internal messaging system |

### Resources & Library (2)
| Page | File | Description |
|------|------|-------------|
| Resource Library | `ResourceLibrary.jsx` | Document repository |
| Subject Manager | `SubjectManager.jsx` | Manage subjects and courses |

### Evaluations (1)
| Page | File | Description |
|------|------|-------------|
| Faculty Evaluations | `FacultyEvaluations.jsx` | Faculty performance evaluations |

### Audit & System (4)
| Page | File | Description |
|------|------|-------------|
| Audit Logs | `AuditLogs.jsx` | System audit log viewer |
| Audit Log Viewer | `AuditLogViewer.jsx` | Detailed audit view |
| Data Management | `DataManagement.jsx` | Import/export data |
| User Role Management | `UserRoleManagement.jsx` | Manage user roles |

### Settings (2)
| Page | File | Description |
|------|------|-------------|
| Settings | `Settings.jsx` | User preferences |
| System Settings | `SystemSettings.jsx` | System configuration |

### Authentication (5)
| Page | File | Description |
|------|------|-------------|
| Login | `Login.jsx` | User authentication |
| Register | `Register.jsx` | New user registration |
| Forgot Password | `ForgotPassword.jsx` | Password recovery request |
| Reset Password | `ResetPassword.jsx` | Password reset with token |
| Not Found | `NotFound.jsx` | 404 error page |

**Total Pages**: 45

---

## 🧩 Components

### Reusable UI Components (22)

#### Navigation
- **Navbar**: Top navigation bar with user menu and notifications
- **Sidebar**: Collapsible side navigation with role-based menu items
- **Breadcrumb**: Breadcrumb navigation for page hierarchy

#### Layout
- **Card**: Wrapper component for content sections
- **Modal**: Reusable modal dialog
- **Footer**: Application footer

#### Data Display
- **Table**: Enhanced table component with sorting and pagination
- **Chart**: Wrapper for chart libraries (Recharts, Chart.js)
- **StatCard**: Statistics display card
- **Badge**: Status and tag badges
- **Avatar**: User avatar component

#### Forms & Input
- **SearchBar**: Search input with debouncing
- **FilterPanel**: Filter controls for lists
- **DatePicker**: Date selection component
- **TimePicker**: Time selection component
- **Dropdown**: Dropdown menu component
- **FileUpload**: File upload with drag-and-drop

#### Utilities
- **Pagination**: Pagination controls for lists
- **LoadingSpinner**: Loading state indicator
- **ErrorBoundary**: Error boundary for graceful error handling
- **ProtectedRoute**: Route guard for authenticated pages
- **Tooltip**: Hover tooltips

---

## 🛣️ Routing

The application uses React Router DOM 7 for client-side routing.

### Main Routes

```jsx
// Public Routes
/                      → Login
/login                 → Login
/register              → Register
/forgot-password       → ForgotPassword
/reset-password        → ResetPassword

// Protected Routes (Requires Authentication)
/dashboard             → Role-based dashboard
/admin-dashboard       → AdminDashboard (Admin only)
/hod-dashboard         → HodDashboard (HOD only)

// Leave Management
/leave-request         → LeaveRequest
/hod-leave-request     → HODLeaveRequest (HOD only)
/leave-approval        → LeaveApproval (HOD only)
/leave-management      → LeaveManagement

// Substitute Management
/substitute-assignment → SubstituteAssignment
/substitute-report     → SubstituteReport
/substitute-analytics  → SubstituteAnalytics

// Schedule
/master-schedule       → MasterSchedule
/personal-timetable    → PersonalTimetable

// Directory
/faculty-directory     → FacultyDirectory
/student-directory     → StudentDirectory

// Assignments
/assignments           → AssignmentManager
/create-assignment     → CreateAssignment
/assignment/:id        → AssignmentDetails

// Attendance
/attendance            → Attendance
/attendance-launcher   → AttendanceLauncher
/attendance-trends     → AttendanceTrends

// Analytics
/analytics             → Analytics
/predictive-analytics  → PredictiveAnalytics
/teacher-analytics     → TeacherAnalytics
/department-metrics    → DepartmentMetrics

// Communication
/announcements         → Announcements
/inbox                 → Inbox

// Resources
/resource-library      → ResourceLibrary
/subject-manager       → SubjectManager

// Evaluations
/faculty-evaluations   → FacultyEvaluations

// Audit & System
/audit-logs            → AuditLogs
/data-management       → DataManagement (Admin only)
/user-credentials      → UserCredentials (Admin only)
/user-role-management  → UserRoleManagement (Admin only)

// Settings
/settings              → Settings
/system-settings       → SystemSettings (Admin only)

// 404
*                      → NotFound
```

### Route Protection

Routes are protected using the `ProtectedRoute` component, which:
- Checks for valid JWT token
- Verifies user role permissions
- Redirects to login if unauthorized
- Shows appropriate error messages

---

## 🔄 State Management

### Context API

The application uses React Context API for global state management.

#### AuthContext
Located in `src/context/AuthContext.jsx`

**Provides:**
- `user` - Current user object
- `token` - JWT authentication token
- `login(credentials)` - Login function
- `logout()` - Logout function
- `isAuthenticated` - Authentication status
- `hasRole(role)` - Role checking function

**Usage:**
```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, hasRole, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user.name}</p>
      {hasRole('admin') && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Local State
Components use React's `useState` and `useEffect` hooks for local state management.

---

## 🔌 API Integration

### Axios Configuration

API client configured in `src/services/api.js`

**Features:**
- Base URL configuration
- JWT token auto-injection
- Request/response interceptors
- Error handling
- Token refresh logic

**Usage:**
```javascript
import api from '../services/api';

// GET request
const fetchData = async () => {
  const response = await api.get('/api/teachers');
  return response.data;
};

// POST request
const createLeave = async (data) => {
  const response = await api.post('/api/leaves', data);
  return response.data;
};

// Upload file
const uploadFile = async (formData) => {
  const response = await api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

### API Endpoints
All endpoints are documented in the root [README.md](file:///c:/Users/athar/Downloads/lecture-manager/README.md)

---

## 🎨 Styling

### TailwindCSS 4

The application uses TailwindCSS 4 with the new Vite plugin for styling.

**Key Features:**
- Utility-first approach
- Custom color palette
- Responsive breakpoints
- Dark mode support (configurable)
- Custom components

### Custom CSS

Additional styling in `src/styles/responsive.css` for:
- Grid layouts
- Animations
- Browser-specific fixes

### Color Scheme

```css
/* Primary Colors */
--primary: #3b82f6      /* Blue */
--secondary: #8b5cf6    /* Purple */
--accent: #10b981       /* Green */

/* Status Colors */
--success: #22c55e
--warning: #f59e0b
--error: #ef4444
--info: #06b6d4

/* Neutral Colors */
--background: #ffffff
--surface: #f9fafb
--text-primary: #111827
--text-secondary: #6b7280
```

---

## 💻 Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Development Server

```bash
npm run dev
```

Starts Vite dev server on `http://localhost:5173`

**Features:**
- Hot Module Replacement (HMR)
- Fast refresh
- Error overlay
- Source maps

### Development Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Environment Variables

Create `.env` file in `client/` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Lecture Manager
```

**Access in code:**
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

---

## 🏗️ Build & Deployment

### Production Build

```bash
npm run build
```

**Output:** `dist/` folder with optimized assets

**Optimizations:**
- Code splitting
- Tree shaking
- Asset minification
- CSS optimization
- Image optimization
- Gzip compression

### Preview Build

```bash
npm run preview
```

Preview production build locally before deployment.

### Deployment Options

#### Option 1: Static Hosting (Recommended)
```bash
# Build
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - AWS S3 + CloudFront
```

#### Option 2: Docker
```bash
# Use root Dockerfile
cd ..
docker build -t lecture-manager .
docker run -p 5173:5173 lecture-manager
```

#### Option 3: Traditional Server
```bash
# Build
npm run build

# Serve with nginx, Apache, or any static file server
# Point to dist/ folder
```

### Build Configuration

Customize build in `vite.config.js`:
- Output directory
- Asset handling
- Plugin configuration
- Build optimizations

---

## 🧪 Code Quality

### Linting

```bash
npm run lint          # Check for issues
```

**Configured Rules:**
- React best practices
- React Hooks rules
- Accessibility (a11y)
- Code formatting

### Best Practices

1. **Component Structure**: One component per file
2. **Naming**: PascalCase for components, camelCase for functions
3. **Props**: PropTypes or TypeScript for type checking (future)
4. **State**: Keep state as local as possible
5. **Performance**: Use React.memo for expensive components
6. **Accessibility**: ARIA labels and semantic HTML

---

## 📊 Performance

### Optimization Techniques

1. **Code Splitting**: Automatic route-based splitting
2. **Lazy Loading**: Dynamic imports for heavy components
3. **Memoization**: React.memo and useMemo for expensive calculations
4. **Image Optimization**: Use WebP format, lazy load images
5. **Bundle Size**: Analyze with `vite-bundle-analyzer`

### Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| First Contentful Paint | <1.5s | ✅ |
| Time to Interactive | <3s | ✅ |
| Bundle Size (gzipped) | <200KB | ✅ |
| Lighthouse Score | >90 | ✅ |

---

## 🔧 Troubleshooting

### Common Issues

#### Port already in use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3001
```

#### Build fails
```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

#### Styling not updating
```bash
# Clear Vite cache
rm -rf .vite
npm run dev
```

#### API connection fails
```bash
# Check backend is running on port 3000
# Verify VITE_API_URL in .env
# Check browser console for CORS errors
```

---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Recharts Documentation](https://recharts.org/)

---

## 🤝 Contributing

When adding new features:
1. Create new page in `src/pages/`
2. Add route in `App.jsx`
3. Update this README with page description
4. Follow existing code patterns
5. Run `npm run lint` before committing

---

**Last Updated**: February 9, 2026  
**Total Pages**: 45  
**Total Components**: 22  
**Status**: ✅ Production Ready
