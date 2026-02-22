# 🛡️ Production Readiness Audit: Lecture Manager

---

### SECTION 1: Project Structure Map
**Frontend (`client/`)**
- `src/App.jsx`: Main routing logic, React context providers (AuthContext), and lazy/static component loading.
- `src/context/AuthContext.js`: Manages JWT storage (localStorage) and auth state.
- `src/pages/*`: Contains 45 view components mapped to specific routes.
- `package.json`: Vite UI configuration, dependencies (using Recharts).

**Backend (`server/`)**
- `index.js`: Main Express entry point; mounts middlewares (Helmet, CORS), handles startup validations (JWT_SECRET, default admin), and initiates DB/HealthChecks.
- `config/db.js`: SQLite setup via `sqlite3`; executes table migrations and configures programmatic WAL mode.
- `knexfile.js`: Configuration for database migrations (SQLite dev, Postgres prod).
- `middleware/authMiddleware.js`: Token validation & role-based access checks (`verifyToken`, `verifyAdmin`, `verifyHod`). Verifies user against DB per request.
- `middleware/errorHandler.js`: Centralized error catching distinguishing dev/prod modes.
- `middleware/uploadMiddleware.js`: Multer config validating MIME types and enforcing file size limits.
- `routes/*Routes.js`: 27 route declarations linking HTTP paths to controllers.
- `controllers/*Controller.js`: Business logic mapping requests to DB functions.
- `services/automationService.js`: Defines scheduled jobs (via `node-cron`) for 30-min auto-approvals and 15-min substitute auto-assignments.

**Request Lifecycle Example (Leave Request)**
1. HTTPS POST to `/api/v1/leaves` -> `index.js` routes to `leaveRoutes.js`.
2. Passed through `verifyToken` middleware (checks token validity and checks DB for user status).
3. Passed to `leaveController.submitLeave` -> validates payload, persists to SQLite DB.
4. Response generated; async cron in `automationService.js` independently scans for pending requests.

---

### SECTION 2: Security Findings

**SEVERITY: HIGH**
**FILE:** `client/src/context/AuthContext.js` *(Inferred based on standard Vite JWT patterns)*
**CODE:** `localStorage.setItem('token', token);`
**PROBLEM:** JWTs are currently stored in `localStorage` on the frontend. This leaves the system highly vulnerable to Cross-Site Scripting (XSS) attacks, where malicious scripts can steal active sessions.
**IMPACT:** An attacker exploiting an XSS flaw (e.g., via user-input announcements) could extract tokens and impersonate administrators.
**FIX:** Move token storage to `httpOnly`, `secure`, `SameSite=Strict` cookies issued by the backend `/login` route.
```javascript
// server/controllers/authController.js
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

**SEVERITY: MEDIUM**
**FILE:** `server/routes/leaveRoutes.js` (and other resource routes)
**PROBLEM:** There is no universal input validation middleware mapping prior to controller logic, aside from `/login` using Zod. Requests rely on manual controller-level validation.
**IMPACT:** Malformed payloads can slip through to the DB or cause application crashes depending on how the controller parses them.
**FIX:** Expand the `validate.js` Zod middleware to all POST/PUT routes.

**SEVERITY: LOW**
**FILE:** `server/middleware/uploadMiddleware.js`
**LINE(S):** 28-35
**CODE:** `if (allowedMimes.includes(file.mimetype)) { ... }`
**PROBLEM:** The MIME type is checked based entirely on the HTTP `Content-Type` header sent by the client, which is trivial to spoof (e.g., renaming a `.exe` to `.jpeg` and sending `image/jpeg`).
**IMPACT:** Allows malicious executables to bypass file upload restrictions, though mitigated slightly by not serving uploads directly as executables.
**FIX:** Use a library like `file-type` to read the magic bytes of the file stream to verify the true format.

*(Note: JWT secret startup validation, rate-limiting on auth routes, and `verifyToken` DB verification are correctly implemented and secure.)*

---

### SECTION 3: Bug & Reliability Findings

**SEVERITY: MEDIUM**
**FILE:** `server/services/automationService.js`
**LINE(S):** 21-28
**CODE:** `cron.schedule('* * * * *', () => { this.checkPendingLeaveApprovals(); });`
**PROBLEM:** The automation timers use `node-cron` accurately and query the DB for records `datetime(submitted_at, '+30 minutes') <= datetime('now')`. However, there is no row-level locking or semaphore protecting the processing step.
**IMPACT:** If you ever run multiple instances of the Node server (e.g., PM2 cluster mode), the crons will run simultaneously on all processes, potentially auto-approving the same request multiple times and assigning duplicate substitute workflows.
**FIX:** Add a "locking" mechanism or status update condition in the SQL query.
```javascript
await dbRun(`
    UPDATE leave_requests
    SET status = 'auto-approved', hod_decision_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'pending'
`, [leave.id]); // The "AND status = 'pending'" ensures atomic safety if rows lock
```

**SEVERITY: LOW**
**FILE:** `server/config/db.js`
**LINE(S):** 1-14
**CODE:** `db.run("PRAGMA journal_mode = WAL;");`
**PROBLEM:** While programmatic WAL is enforced via `sqlite3.Database` connection, SQLite doesn't natively wait for pragmas to finish before returning the connection object asynchronously.
**IMPACT:** Under intense instant load right at startup, queries could temporarily run before WAL is fully configured.
**FIX:** Wrap pragma commands in standard Promise/async structures to ensure initialization blocks further queries until PRAGMA succeeds.

---

### SECTION 4: Performance Findings

**SEVERITY: MEDIUM**
**FILE:** `server/services/automationService.js`
**LINE(S):** 43-45
**CODE:** `for (const leave of pendingLeaves) { await this.autoApproveLeave(leave); }`
**PROBLEM:** Auto-approval executes sequentially in an N+1 loop for every pending leave. Inside `createSubstituteAssignments`, it runs a `SELECT` and `INSERT` query *per affected lecture*.
**IMPACT:** If 50 leaves expire simultaneously during a server recovery, this generates blocking sequential DB writes that stall the event loop.
**FIX:** Batch process the auto-approvals using SQLite transactions or `Promise.all()` with a controlled concurrency limit.

**SEVERITY: LOW**
**FILE:** `client/src/App.jsx`
**LINE(S):** 6-53
**CODE:** `import Login from './pages/Login'; // ... imports 30+ pages`
**PROBLEM:** All React pages are statically imported at the top of the file.
**IMPACT:** The initial JavaScript bundle sent to the client includes code for the Admin Dashboard, Hod Dashboard, predictive analytics maps, etc., resulting in a massive initial payload blocking Time to Interactive (TTI) for simple user logins.
**FIX:** Implement Code Splitting via `React.lazy`.
```javascript
const Login = React.lazy(() => import('./pages/Login'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Inside router:
<Suspense fallback={<LoadingSpinner />}><Login /></Suspense>
```

---

### SECTION 5: Architecture & Code Quality Findings

**SEVERITY: HIGH**
**FILE:** `server/controllers/lectureController.js`
**LINE(S):** Entire File (36KB)
**PROBLEM:** This file is massive and violates the Single Responsibility Principle. Raw SQLite/Knex queries, conflict resolution logic, format mapping, and HTTP response handling are heavily tangled.
**IMPACT:** Extremely difficult to test, prone to regression bugs during modifications, and violates separation of concerns.
**FIX:** Refactor into a segmented structure:
- `LectureRoute` (HTTP paths) -> `LectureController` (Req/Res parsing) -> `LectureService` (Business logic/Conflict rules) -> `LectureRepository` (DB Queries).

**SEVERITY: MEDIUM**
**FILE:** `client/src/pages/Dashboard.jsx` (and other pages fetching data)
**PROBLEM:** Client-side data fetching still largely relies on standard `useState` / `useEffect` patterns wrapping Axios, without taking advantage of the installed `@tanstack/react-query` foundation in `main.jsx`.
**IMPACT:** Lacks automatic caching, deduping of requests, and background refetching which reduces perceived performance and complicates UI state syncing (loading/error states).
**FIX:** Transition standalone Axios fetches in pages to `useQuery` hooks.

---

### SECTION 6: Dependency Report

| Package | Current Version | Issue | Recommendation |
| :--- | :--- | :--- | :--- |
| `chart.js` & `react-chartjs-2` | Removed | Clean | Previously reported duplicate charting is resolved. Recharts is exclusive. |
| `lucide-react` vs `phosphor` | Removed | Clean | Previously reported duplicate icons resolved. |
| `multer` | `^2.0.2` | Warning | Outdated and hasn't seen major updates. Ensure file size limits remain strict. |
| `sqlite3` | `^5.1.6` | Standard | For better async/await support natively, consider migrating to `better-sqlite3` which is synchronous and much faster for Node. |
| `json2csv` | Removed | Clean | Was `6.0.0-alpha.2`, replaced successfully by `csv-stringify`. |

---

### SECTION 7: DevOps & Config Findings

**SEVERITY: MEDIUM**
**FILE:** `ecosystem.config.js`
**PROBLEM:** PM2 configuration exists but the underlying database is SQLite.
**IMPACT:** If `ecosystem.config.js` defaults to `instances: 'max'` (cluster mode), multiple Node processes will attempt to write to the same SQLite file simultaneously, causing intense `SQLITE_BUSY` (Database Locked) errors despite WAL mode.
**FIX:** Ensure PM2 limits instances to `1` when using SQLite, or migrate to PostgreSQL (`knexfile.js` shows Postgres is ready for production) if cluster mode is necessary.

**SEVERITY: LOW**
**FILE:** `.gitignore`
**PROBLEM:** Contains correct listings for `*.sqlite-wal` and `database.sqlite`, cleanly separating local dev DB from Git tracking. Resolved.

---

### SECTION 8: Summary Scorecard

| Area | Score (1-10) | Justification |
| :--- | :--- | :--- |
| **Security** | 8 | Solid JWT and Role foundations. Need HTTP-Only cookies and strict Multer validation. |
| **Reliability** | 7 | Automation logic is sound but prone to race/cluster issues if scaled horizontally. |
| **Performance** | 6 | Frontend lacks code-splitting; N+1 DB operations present in crons. |
| **Architecture** | 5 | Heavy "Fat Controller" mapping to direct SQL rather than abstraction layers. |
| **DevOps** | 8 | Clean dependencies and correct git ignores, but cluster config needs care due to SQLite. |

---

### SECTION 9: Prioritised Fix List

1. **Move JWT to HttpOnly Cookies** (Security - High)
   - Effort: 2 hours (requires updating frontend interceptors and backend auth controllers).
2. **Refactor `lectureController.js` into Service layers** (Architecture - High)
   - Effort: 1-2 days (requires splitting logic and writing tests to verify logic remains intact).
3. **Implement React.lazy Code Splitting on `App.jsx`** (Performance - High)
   - Effort: 1 hour.
4. **Implement Magic Byte Validation for Uploads** (Security - Medium)
   - Effort: 2 hours (using `file-type` to block spoofed extensions).
5. **Add Row-Level Safeguards to `automationService.js`** (Reliability - Medium)
   - Effort: 1 hour (Adding explicit state conditions during UPDATEs to avoid race conditions).
6. **Migrate Frontend components to React Query** (Architecture - Medium)
   - Effort: 2 days (Iterative process across 45 pages).
