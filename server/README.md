# ⚙️ Lecture Manager - Backend API Server

**Framework**: Express 4.18.2  
**Database**: SQLite3 5.1.6  
**Version**: 2.0.0  
**Last Updated**: February 9, 2026

## Overview

The Lecture Manager backend is an enterprise-grade RESTful API server built with Node.js and Express. It provides comprehensive endpoints for managing academic operations, implements automated workflows, and features robust security, logging, and error handling.

### Key Features
- 🔒 JWT-based authentication with role-based access control
- 🤖 Automated leave approval and substitute assignment system
- 📧 Email notification service with Nodemailer
- 📊 Winston-based structured logging
- 🗄️ SQLite database with Knex.js migrations
- 🛡️ Helmet security headers
- 📁 File upload support with Multer
- 📈 Comprehensive analytics and reporting
- 🔍 Global search functionality
- 🤖 AI-powered predictions and recommendations
- ⏰ Cron-based scheduled tasks
- 🏥 Health check endpoints

---

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Controllers](#controllers)
- [Services](#services)
- [Middleware](#middleware)
- [Database](#database)
- [Authentication](#authentication)
- [File Uploads](#file-uploads)
- [Email Service](#email-service)
- [Logging](#logging)
- [Automation](#automation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

---

## 🛠️ Technology Stack

### Core
- **Node.js**: JavaScript runtime
- **Express**: 4.18.2 - Web framework
- **SQLite3**: 5.1.6 - Embedded database

### Database & ORM
- **Knex.js**: 3.1.0 - SQL query builder and migration tool
- **SQLite3**: 5.1.6 - Database engine

### Authentication & Security
- **JSON Web Token**: 9.0.2 - JWT authentication
- **Bcrypt**: 5.1.1 - Password hashing
- **Helmet**: 8.1.0 - Security headers
- **CORS**: 2.8.5 - Cross-origin resource sharing

### File Handling
- **Multer**: 2.0.2 - File upload middleware
- **PDFKit**: 0.15.2 - PDF generation
- **ExcelJS**: 4.4.0 - Excel file manipulation
- **XLSX**: 0.18.5 - Excel parsing

### Email & Notifications
- **Nodemailer**: 7.0.12 - Email sending

### Logging & Monitoring
- **Winston**: 3.19.0 - Logging library

### Utilities
- **dotenv**: 16.3.1 - Environment variables
- **UUID**: 13.0.0 - Unique ID generation
- **Node-Cron**: 4.2.1 - Task scheduling
- **json2csv**: 6.0.0-alpha.2 - CSV export
- **Body-Parser**: 1.20.2 - Request body parsing

### Development
- **Nodemon**: 3.0.1 - Auto-restart during development
- **Jest**: Testing framework (configured)

---

## 📁 Project Structure

```
server/
├── routes/                         # 27 API Route Modules
│   ├── authRoutes.js               # Authentication & login
│   ├── passwordResetRoutes.js      # Password recovery
│   ├── teacherRoutes.js            # Teacher management
│   ├── studentRoutes.js            # Student management
│   ├── hodRoutes.js                # HOD operations
│   ├── adminRoutes.js              # Admin operations
│   ├── lectureRoutes.js            # Lecture scheduling
│   ├── leaveRoutes.js              # Leave management (20KB)
│   ├── substituteRoutes.js         # Substitute assignments
│   ├── assignmentRoutes.js         # Assignment management
│   ├── announcementRoutes.js       # Announcements
│   ├── resourceRoutes.js           # Resource library
│   ├── evaluationRoutes.js         # Faculty evaluations
│   ├── analyticsRoutes.js          # Analytics endpoints
│   ├── reportRoutes.js             # Report generation
│   ├── aiRoutes.js                 # AI features
│   ├── auditRoutes.js              # Audit logging
│   ├── automationRoutes.js         # Automation config (8KB)
│   ├── calendarRoutes.js           # Calendar integration
│   ├── fileRoutes.js               # File management
│   ├── notificationRoutes.js       # Notifications
│   ├── searchRoutes.js             # Global search
│   ├── settingsRoutes.js           # Settings management
│   ├── configRoutes.js             # System configuration
│   ├── dataManagementRoutes.js     # Data import/export
│   ├── healthRoutes.js             # Health checks
│   └── subjectRoutes.js            # Subject management
│
├── controllers/                    # 27 Business Logic Controllers
│   ├── authController.js           # Authentication logic
│   ├── passwordResetController.js  # Password reset
│   ├── teacherController.js        # Teacher operations
│   ├── studentController.js        # Student operations
│   ├── hodController.js            # HOD operations
│   ├── adminController.js          # Admin operations
│   ├── lectureController.js        # Lecture logic (36KB - largest)
│   ├── leaveController.js          # Leave logic (14KB)
│   ├── substituteController.js     # Substitute logic
│   ├── assignmentController.js     # Assignment logic
│   ├── announcementController.js   # Announcement logic
│   ├── resourceController.js       # Resource logic
│   ├── evaluationController.js     # Evaluation logic
│   ├── analyticsController.js      # Analytics calculations
│   ├── reportController.js         # Report generation (25KB)
│   ├── aiController.js             # AI predictions (14KB)
│   ├── auditController.js          # Audit logging
│   ├── calendarController.js       # Calendar logic
│   ├── fileController.js           # File operations
│   ├── notificationController.js   # Notification logic
│   ├── searchController.js         # Search logic
│   ├── settingsController.js       # Settings logic
│   ├── configController.js         # Config management
│   ├── advancedConfigController.js # Advanced config
│   ├── subjectController.js        # Subject operations
│   ├── predictiveAnalyticsController.js # Predictive analytics
│   └── analyticsHelper.js          # Analytics utilities
│
├── services/                       # 13 Business Services
│   ├── automationService.js        # Auto-approval/assignment timers
│   ├── emailService.js             # Email sending
│   ├── errorLogger.js              # Error tracking
│   ├── notificationService.js      # Notification dispatch
│   ├── reportService.js            # Report generation
│   ├── analyticsService.js         # Analytics calculations
│   ├── fileService.js              # File operations
│   ├── backupService.js            # Database backups
│   ├── migrationService.js         # Database migrations
│   ├── aiService.js                # AI predictions
│   ├── cacheService.js             # Caching layer
│   ├── validationService.js        # Input validation
│   └── cronService.js              # Scheduled tasks
│
├── middleware/                     # 6 Middleware Modules
│   ├── auth.js                     # JWT verification
│   ├── roleCheck.js                # Role-based access control
│   ├── errorHandler.js             # Error handling
│   ├── validation.js               # Input validation
│   ├── rateLimiter.js              # Rate limiting
│   └── upload.js                   # File upload middleware
│
├── config/
│   └── db.js                       # Database configuration
│
├── constants/
│   └── roles.js                    # Role constants
│
├── utils/                          # 9 Utility Modules
│   ├── logger.js                   # Winston logger
│   ├── healthCheck.js              # Health check utilities
│   ├── gracefulShutdown.js         # Graceful shutdown
│   ├── emailTemplates.js           # Email templates
│   ├── pdfGenerator.js             # PDF utilities
│   ├── excelGenerator.js           # Excel utilities
│   ├── dateUtils.js                # Date formatting
│   ├── validators.js               # Validation helpers
│   └── responseHelper.js           # Response formatting
│
├── scripts/                        # 77 Utility Scripts
│   ├── setup/                      # Database setup scripts
│   ├── maintenance/                # Maintenance scripts
│   └── archive/                    # Archived scripts
│
├── __tests__/                      # 3 Test Suites
│   ├── auth.test.js
│   ├── leave.test.js
│   └── substitute.test.js
│
├── logs/                           # Application logs
│   ├── app.log                     # General logs
│   ├── error.log                   # Error logs
│   └── combined.log                # All logs
│
├── backups/                        # Database backups
├── uploads/                        # Uploaded files
│
├── database.sqlite                 # Main SQLite database
├── database.sqlite-shm             # Shared memory file
├── database.sqlite-wal             # Write-ahead log
│
├── knexfile.js                     # Knex migration config
├── index.js                        # Server entry point
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## 🛣️ API Routes

### Authentication & Authorization (2 modules)

#### authRoutes.js
**Base Path**: `/api/auth`
- `POST /login` - User authentication
- `POST /logout` - User logout
- `POST /register` - New user registration
- `GET /verify` - Verify JWT token
- `GET /profile` - Get user profile

#### passwordResetRoutes.js
**Base Path**: `/api/auth`
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /verify-reset-token/:token` - Verify reset token

### User Management (4 modules)

#### teacherRoutes.js
**Base Path**: `/api/teachers`
- `GET /` - List all teachers
- `GET /:id` - Get teacher by ID
- `POST /` - Create teacher
- `PUT /:id` - Update teacher
- `DELETE /:id` - Delete teacher
- `GET /department/:id` - Teachers by department
- `GET /available` - Available teachers

#### studentRoutes.js
**Base Path**: `/api/students`
- `GET /` - List all students
- `GET /:id` - Get student by ID
- `POST /` - Create student
- `PUT /:id` - Update student
- `DELETE /:id` - Delete student
- `GET /class/:id` - Students by class

#### hodRoutes.js
**Base Path**: `/api/hod`
- `GET /dashboard` - HOD dashboard data
- `GET /department-stats` - Department statistics
- `GET /teachers` - Department teachers
- `GET /pending-approvals` - Pending leave approvals

#### adminRoutes.js
**Base Path**: `/api/admin`
- `GET /users` - All users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /system-stats` - System statistics
- `POST /bulk-upload` - Bulk user upload

### Academic Management (4 modules)

#### lectureRoutes.js (Largest: 2.7KB)
**Base Path**: `/api/lectures`
- `GET /` - All lectures
- `GET /schedule` - Master schedule
- `GET /my-timetable` - Personal timetable
- `POST /` - Create lecture
- `PUT /:id` - Update lecture
- `DELETE /:id` - Delete lecture
- `GET /conflicts` - Detect conflicts
- `GET /teacher/:id` - Teacher's lectures
- `GET /class/:id` - Class lectures

#### subjectRoutes.js
**Base Path**: `/api/subjects`
- `GET /` - List subjects
- `POST /` - Create subject
- `PUT /:id` - Update subject
- `DELETE /:id` - Delete subject
- `GET /department/:id` - Subjects by department

#### assignmentRoutes.js
**Base Path**: `/api/assignments`
- `GET /` - List assignments
- `GET /:id` - Get assignment
- `POST /` - Create assignment (with file upload)
- `PUT /:id` - Update assignment
- `DELETE /:id` - Delete assignment
- `POST /:id/submit` - Submit assignment

#### evaluationRoutes.js
**Base Path**: `/api/evaluations`
- `GET /` - List evaluations
- `POST /` - Create evaluation
- `GET /:id` - Get evaluation
- `PUT /:id` - Update evaluation

### Leave & Substitute Management (2 modules)

#### leaveRoutes.js (Largest: 20KB)
**Base Path**: `/api/leaves`
- `GET /` - Fetch leaves (role-filtered)
- `POST /` - Submit leave request
- `GET /:id` - Get leave details
- `PUT /:id/approve` - Approve/deny leave
- `DELETE /:id` - Cancel leave
- `GET /my-leaves` - User's leave history
- `GET /pending` - Pending approvals
- `GET /statistics` - Leave statistics
- `GET /lectures/needingsubstitutes` - Lectures needing substitutes
- `GET /teachers/available` - Available teachers
- `POST /substitute/assign` - Assign substitute
- `GET /substitute/assignments` - Assignment history
- `GET /substitute/report` - Weekly report
- `GET /substitute/analytics` - Analytics
- `PUT /substitute/accept/:id` - Accept assignment
- `PUT /substitute/decline/:id` - Decline assignment

#### substituteRoutes.js
**Base Path**: `/api/substitutes`
- `GET /assignments` - All assignments
- `GET /my-assignments` - User's assignments
- `GET /analytics` - Substitute analytics

### Communication (2 modules)

#### announcementRoutes.js
**Base Path**: `/api/announcements`
- `GET /` - List announcements (role-filtered)
- `POST /` - Create announcement
- `PUT /:id` - Update announcement
- `DELETE /:id` - Delete announcement
- `GET /active` - Active announcements

#### notificationRoutes.js
**Base Path**: `/api/notifications`
- `GET /` - User notifications
- `GET /unread` - Unread count
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read
- `DELETE /:id` - Delete notification

### Resources & Files (2 modules)

#### resourceRoutes.js
**Base Path**: `/api/resources`
- `GET /` - List resources
- `GET /:id` - Get resource
- `POST /` - Upload resource
- `DELETE /:id` - Delete resource
- `GET /download/:id` - Download resource
- `GET /category/:id` - Resources by category

#### fileRoutes.js
**Base Path**: `/api/files`
- `POST /upload` - File upload
- `GET /:id` - Get file metadata
- `GET /download/:id` - Download file
- `DELETE /:id` - Delete file

### Analytics & Reports (2 modules)

#### analyticsRoutes.js
**Base Path**: `/api/analytics`
- `GET /dashboard` - Dashboard data
- `GET /department/:id` - Department metrics
- `GET /teacher/:id` - Teacher analytics
- `GET /student/:id` - Student performance
- `GET /attendance` - Attendance analytics
- `GET /leave-trends` - Leave patterns

#### reportRoutes.js
**Base Path**: `/api/reports`
- `GET /attendance` - Attendance reports
- `GET /substitute` - Substitute reports
- `GET /performance` - Performance reports
- `POST /generate` - Generate custom report
- `GET /export/:type` - Export (CSV/Excel/PDF)

### AI Features (1 module)

#### aiRoutes.js
**Base Path**: `/api/ai`
- `POST /predict-workload` - Predict teacher workload
- `POST /recommend-substitute` - AI recommendations
- `GET /analytics` - AI analytics
- `POST /analyze-patterns` - Pattern analysis
- `POST /optimize-schedule` - Schedule optimization

### System Management (7 modules)

#### auditRoutes.js
**Base Path**: `/api/audit`
- `GET /logs` - Audit log entries
- `GET /user/:id` - User activity
- `GET /export` - Export logs

#### automationRoutes.js (8KB)
**Base Path**: `/api/automation`
- `GET /config` - Automation configuration
- `PUT /config` - Update automation settings
- `GET /timers` - Active timers
- `GET /history` - Automation history
- `POST /trigger/:type` - Manual trigger

#### calendarRoutes.js
**Base Path**: `/api/calendar`
- `GET /events` - Calendar events
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `GET /month/:date` - Month view

#### searchRoutes.js
**Base Path**: `/api/search`
- `GET /global` - Global search
- `GET /teachers` - Search teachers
- `GET /students` - Search students
- `GET /lectures` - Search lectures

#### settingsRoutes.js
**Base Path**: `/api/settings`
- `GET /user` - User preferences
- `PUT /user` - Update preferences
- `GET /system` - System settings
- `PUT /system` - Update system settings

#### configRoutes.js
**Base Path**: `/api/config`
- `GET /settings` - Configuration
- `PUT /settings` - Update configuration
- `GET /defaults` - Default values

#### dataManagementRoutes.js
**Base Path**: `/api/admin`
- `POST /import/teachers` - Import teachers (CSV/Excel)
- `POST /import/students` - Import students
- `POST /import/lectures` - Import lectures
- `GET /export/teachers` - Export teachers
- `GET /export/students` - Export students
- `GET /export/database` - Full database export

#### healthRoutes.js
**Base Path**: `/api/health`
- `GET /` - Health check
- `GET /status` - System status
- `GET /metrics` - Performance metrics
- `GET /database` - Database health

**Total Route Modules**: 27

---

## 🎮 Controllers

### Controller Overview

Controllers handle business logic and coordinate between routes, services, and the database.

### Key Controllers

#### lectureController.js (36KB)
Largest controller handling all lecture operations:
- Schedule management
- Conflict detection
- Timetable generation
- Lecture CRUD operations
- Teacher and class scheduling

#### reportController.js (25KB)
Comprehensive reporting functionality:
- PDF report generation
- Excel export
- CSV generation
- Custom report builder
- Statistical analysis

#### leaveController.js (14KB)
Leave management logic:
- Leave request processing
- Approval workflow
- Leave balance calculations
- Leave history

#### aiController.js (14KB)
AI-powered features:
- Workload predictions
- Substitute recommendations
- Pattern analysis
- Schedule optimization

### Controller Pattern

```javascript
// Example controller structure
exports.getAll = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const results = await service.fetchData(role, userId);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error in getAll:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🔧 Services

### Service Layer

Services contain reusable business logic and can be called by multiple controllers.

### Key Services

#### automationService.js
**Purpose**: Automated workflows
- 30-minute auto-approval timer
- 15-minute auto-assignment timer
- Scheduled task execution
- Start/stop automation

**Key Functions**:
- `start()` - Start automation service
- `stop()` - Stop automation service
- `checkPendingApprovals()` - Auto-approve leaves
- `checkPendingAssignments()` - Auto-assign substitutes

#### emailService.js
**Purpose**: Email notifications
- Send leave notifications
- Send approval emails
- Send substitute assignment emails
- Template-based emails

**Key Functions**:
- `sendLeaveNotification(leave, user)`
- `sendApprovalNotification(leave, decision)`
- `sendSubstituteAssignment(assignment, teacher)`

#### errorLogger.js
**Purpose**: Error tracking and logging
- Log errors with severity
- Track error patterns
- Generate error reports

#### notificationService.js
**Purpose**: In-app notifications
- Create notifications
- Send to specific users/roles
- Mark as read
- Delete notifications

#### reportService.js
**Purpose**: Report generation
- PDF generation with PDFKit
- Excel export with ExcelJS
- CSV export
- Custom report templates

#### analyticsService.js
**Purpose**: Data analytics
- Calculate metrics
- Generate statistics
- Trend analysis
- Performance calculations

#### fileService.js
**Purpose**: File operations
- Save uploaded files
- Delete files
- Generate file URLs
- Validate file types

---

## 🛡️ Middleware

### Authentication Middleware

#### auth.js
JWT token verification middleware

```javascript
// Protect routes
router.get('/protected', auth, controller.getData);

// Extract user from token
req.user = {
  userId: decoded.userId,
  role: decoded.role,
  email: decoded.email
};
```

#### roleCheck.js
Role-based access control

```javascript
// Admin only
router.post('/admin-only', auth, roleCheck(['admin']), controller.action);

// Multiple roles
router.get('/data', auth, roleCheck(['admin', 'hod']), controller.getData);
```

### Error Handling Middleware

#### errorHandler.js
Centralized error handling

**Features**:
- Error logging
- User-friendly error messages
- Stack trace in development
- 404 handler
- 500 handler

### Other Middleware

#### validation.js
Request validation middleware

#### rateLimiter.js
Rate limiting (configurable)

#### upload.js
File upload configuration with Multer

---

## 💾 Database

### SQLite with Knex.js

**Database File**: `database.sqlite`

### Configuration

```javascript
// knexfile.js
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};
```

### Key Tables

#### User Tables
- `users` - All system users
- `teachers` - Teacher-specific data
- `students` - Student-specific data
- `admins` - Admin users
- `hods` - HOD records

#### Academic Tables
- `lectures` - Lecture schedule
- `subjects` - Course subjects
- `departments` - Departments
- `classes` - Class sections
- `attendance` - Attendance records

#### Leave & Substitute
- `leave_requests` - Leave applications
- `substitute_assignments` - Substitute records
- `leave_approvals` - Approval history

#### Assignments & Resources
- `assignments` - Assignment metadata
- `assignment_submissions` - Submissions
- `resources` - Resource library
- `files` - File metadata

#### Communication
- `announcements` - System announcements
- `notifications` - User notifications
- `messages` - Internal messages

#### System
- `audit_logs` - Activity tracking
- `system_settings` - Configuration
- `user_preferences` - User settings

### Database Operations

```bash
# Run migrations
npm run migrate:latest

# Rollback
npm run migrate:rollback

# Check status
npm run migrate:status

# Create migration
npm run migrate:make migration_name
```

### WAL Mode (Recommended)

```bash
sqlite3 database.sqlite "PRAGMA journal_mode=WAL;"
```

Benefits:
- Better concurrency
- Improved performance
- Reduced locking

---

## 🔐 Authentication

### JWT Authentication

#### Login Flow
1. User submits credentials
2. Server verifies username/password
3. Generate JWT token
4. Return token to client
5. Client stores token (localStorage)
6. Client sends token in Authorization header

#### Token Structure
```javascript
{
  userId: 123,
  email: "user@college.edu",
  role: "teacher",
  iat: 1234567890,
  exp: 1234654321
}
```

#### Password Hashing
- **Algorithm**: Bcrypt
- **Salt Rounds**: 10
- **Storage**: Hashed password in database

### Role-Based Access Control (RBAC)

#### Roles
- `admin` - Full system access
- `hod` - Department management
- `teacher` - Teaching operations
- `student` - Student access

#### Permission Checks
```javascript
// In routes
router.post('/admin', auth, roleCheck(['admin']), controller.action);

// In controllers
if (req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## 📁 File Uploads

### Multer Configuration

**Upload Directory**: `uploads/`

**Supported Types**:
- Documents: PDF, DOC, DOCX
- Spreadsheets: XLS, XLSX, CSV
- Images: JPG, PNG, GIF
- Archives: ZIP

**File Size Limit**: 10MB (configurable)

### Upload Endpoints

```javascript
// Single file
POST /api/files/upload
Content-Type: multipart/form-data

// Assignment with file
POST /api/assignments
Content-Type: multipart/form-data
```

### Storage Structure
```
uploads/
├── assignments/
├── resources/
├── profiles/
└── temp/
```

---

## 📧 Email Service

### Nodemailer Configuration

**Configuration** (`.env`):
```env
EMAIL_USER=noreply@college.edu
EMAIL_PASS=app-password
EMAIL_FROM=Lecture Manager <noreply@college.edu>
```

### Email Templates

1. **Leave Request Submitted**
2. **Leave Approved/Denied**
3. **Substitute Assignment**
4. **New Announcement**
5. **Password Reset**

### Usage

```javascript
const emailService = require('../services/emailService');

await emailService.sendLeaveNotification({
  to: 'hod@college.edu',
  leave: leaveData,
  user: userData
});
```

---

## 📝 Logging

### Winston Logger

**Configuration**: `utils/logger.js`

**Log Levels**:
- `error` - Errors
- `warn` - Warnings
- `info` - Informational
- `http` - HTTP requests
- `debug` - Debug information

**Log Files**:
- `logs/app.log` - All logs
- `logs/error.log` - Errors only
- `logs/combined.log` - Combined output

### Usage

```javascript
const logger = require('../utils/logger');

logger.info('Server started');
logger.error('Database connection failed', { error });
logger.http(`${req.method} ${req.url}`);
```

### Request Logging

All HTTP requests are automatically logged with:
- Method
- URL
- Status code
- Response time
- User (if authenticated)

---

## 🤖 Automation

### Automation Service

**File**: `services/automationService.js`

### Auto-Approval Timer

**Default**: 30 minutes
- Checks every minute for pending leaves
- Auto-approves if HOD hasn't responded
- Sends notifications
- Logs action

### Auto-Assignment Timer

**Default**: 15 minutes
- Checks for unassigned substitutes
- Finds available teachers
- Auto-assigns based on workload
- Sends notifications
- Logs action

### Scheduled Tasks

**Implemented with node-cron**:
- Daily attendance reminders
- Weekly reports
- Monthly analytics
- Database backups

### Configuration

```javascript
// Modify timers in automationService.js
const AUTO_APPROVAL_TIME = 30; // minutes
const AUTO_ASSIGNMENT_TIME = 15; // minutes
```

---

## 💻 Development

### Prerequisites
- Node.js 16+
- npm or yarn
- SQLite3 CLI (optional)

### Installation

```bash
cd server
npm install
```

### Development Server

```bash
npm run dev
```

Starts server with nodemon on `http://localhost:3000`

### Development Scripts

```bash
npm start              # Start production server
npm run dev            # Start with nodemon (auto-reload)
npm test               # Run Jest tests
npm run test:watch     # Jest watch mode
npm run test:coverage  # Test coverage
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting issues
```

### Environment Variables

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=./database.sqlite

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=7d

# Email
EMAIL_USER=your-email@college.edu
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@college.edu

# Automation
AUTO_APPROVAL_TIME=30
AUTO_ASSIGNMENT_TIME=15

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

---

## 🧪 Testing

### Jest Configuration

**Test Directory**: `__tests__/`

### Test Suites

1. **auth.test.js** - Authentication tests
2. **leave.test.js** - Leave management tests
3. **substitute.test.js** - Substitute assignment tests

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests only
npm run test:integration
```

### Writing Tests

```javascript
describe('Leave Controller', () => {
  it('should create leave request', async () => {
    const response = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${token}`)
      .send(leaveData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure email service
- [ ] Enable database WAL mode
- [ ] Setup log rotation
- [ ] Configure HTTPS
- [ ] Enable rate limiting
- [ ] Setup monitoring
- [ ] Configure backups

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start index.js --name lecture-manager-api

# Enable startup on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Docker Deployment

```bash
# Build
docker build -t lecture-manager-server .

# Run
docker run -p 3000:3000 lecture-manager-server
```

### Environment-Specific Settings

#### Development
- Detailed error messages
- Debug logging
- No rate limiting

#### Production
- Generic error messages
- Info-level logging
- Rate limiting enabled
- HTTPS required
- CORS configured

---

## 🔧 Troubleshooting

### Common Issues

#### Database locked
```bash
# Enable WAL mode
sqlite3 database.sqlite "PRAGMA journal_mode=WAL;"
```

#### Port in use
```bash
# Change PORT in .env
PORT=3001
```

#### Email not sending
```bash
# Check .env configuration
# Verify app password (not regular password)
# Test SMTP connection
```

#### JWT errors
```bash
# Verify JWT_SECRET is set
# Check token expiry
# Ensure client sends token correctly
```

---

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Knex.js Documentation](https://knexjs.org/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [JWT Documentation](https://jwt.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)

---

## 🤝 Contributing

When adding new features:
1. Create route in `routes/`
2. Create controller in `controllers/`
3. Add service logic if needed in `services/`
4. Update this README
5. Write tests
6. Run `npm run lint`

---

**Last Updated**: February 9, 2026  
**Total Routes**: 27 modules  
**Total Controllers**: 27 modules  
**Total Services**: 13 modules  
**Status**: ✅ Production Ready
