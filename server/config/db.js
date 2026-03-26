/**
 * Database Configuration & Inline Migration System
 * =================================================
 * 
 * ARCHITECTURE NOTE:
 * This file handles database connection, table creation, and schema migrations
 * all in one place. The ALTER TABLE statements run on every server start but
 * silently fail if the column already exists (by design).
 * 
 * FUTURE IMPROVEMENT:
 * These inline migrations should be refactored to use the Knex migration system
 * (already installed) for proper version tracking. Use:
 *   npm run migrate:make  — create a new migration file
 *   npm run migrate:latest — run pending migrations
 *   npm run migrate:rollback — undo the last batch
 * 
 * TABLES MANAGED (17+):
 *   teachers, lectures, notifications, students, attendance_records,
 *   settings, files, resources, leave_requests, substitute_assignments,
 *   assignments, submissions, announcements, subjects, user_roles,
 *   syllabus_topics, login_attempts, audit_logs, config_audit,
 *   config_templates, departments, academic_years, time_slots,
 *   divisions, rooms, system_config, designations
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('✅ Database Connected.');
});

// Configure for performance
db.configure('busyTimeout', 3000);

const initDB = () => new Promise((resolve, reject) => {
    db.run("PRAGMA journal_mode = WAL;", (err1) => {
        if (err1) return reject(err1);
        db.run("PRAGMA synchronous = NORMAL;", (err2) => {
            if (err2) return reject(err2);

            db.serialize(() => {
                // 1. Teachers Table (Added password hash support)
                db.run(`CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY, 
            name TEXT, 
            department TEXT, 
            email TEXT UNIQUE, 
            is_hod INTEGER, 
            is_acting_hod INTEGER DEFAULT 0,
            post TEXT, 
            password TEXT
        )`);

                // Migration for existing databases
                db.run("ALTER TABLE teachers ADD COLUMN is_acting_hod INTEGER DEFAULT 0", (err) => {
                    if (!err) console.log("✨ Migrated: Added is_acting_hod column");
                });

                const newTeacherColumns = [
                    "contact_number TEXT",
                    "qualification TEXT",
                    "date_of_joining TEXT",
                    "is_active INTEGER DEFAULT 1",
                    "status TEXT DEFAULT 'active'",
                    "profile_photo TEXT",
                    "role TEXT DEFAULT 'faculty'",
                    "encrypted_password TEXT"
                ];
                newTeacherColumns.forEach(col => {
                    db.run(`ALTER TABLE teachers ADD COLUMN ${col}`, (err) => {
                        if (!err) console.log(`✨ Migrated: Added teachers.${col.split(' ')[0]}`);
                    });
                });

                // Migration for announcements
                db.run("ALTER TABLE announcements ADD COLUMN department TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added announcements.department");
                });
                db.run("ALTER TABLE announcements ADD COLUMN expires_at DATETIME", (err) => {
                    if (!err) console.log("✨ Migrated: Added announcements.expires_at");
                });
                db.run("ALTER TABLE announcements ADD COLUMN is_pinned INTEGER DEFAULT 0", (err) => {
                    if (!err) console.log("✨ Migrated: Added announcements.is_pinned");
                });

                // Migration for notifications
                db.run("ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal'", (err) => {
                    if (!err) console.log("✨ Migrated: Added notifications.priority");
                });
                db.run("ALTER TABLE notifications ADD COLUMN action_url TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added notifications.action_url");
                });

                // 2. Lectures Table
                db.run(`CREATE TABLE IF NOT EXISTS lectures (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            teacher_id INTEGER, 
            scheduled_teacher_id INTEGER, 
            substitute_teacher_id INTEGER, 
            subject TEXT, 
            class_year TEXT, 
            room TEXT, 
            date TEXT, 
            day_of_week TEXT,
            time_slot TEXT,
            start_time TEXT, 
            end_time TEXT, 
            status TEXT,
            division TEXT,
            total_students INTEGER DEFAULT 60, 
            attendance_count INTEGER DEFAULT 0
        )`);

                // Migration for lectures
                db.run("ALTER TABLE lectures ADD COLUMN division TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added lectures.division");
                });

                db.run("ALTER TABLE lectures ADD COLUMN day_of_week TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added lectures.day_of_week");
                });

                db.run("ALTER TABLE lectures ADD COLUMN time_slot TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added lectures.time_slot");
                });

                // 3. Notifications Table
                db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            target_teacher_id INTEGER, 
            lecture_id INTEGER, 
            type TEXT, 
            title TEXT, 
            message TEXT, 
            status TEXT, 
            seen INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 4. Students Table
                db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY, 
            name TEXT, 
            roll_no TEXT,
            email TEXT,
            class_year TEXT, 
            department TEXT,
            division TEXT,
            photo_url TEXT
        )`);

                // Migration for students
                db.run("ALTER TABLE students ADD COLUMN department TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added students.department");
                });
                db.run("ALTER TABLE students ADD COLUMN division TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added students.division");
                });

                // 5. Attendance Records Table
                db.run(`CREATE TABLE IF NOT EXISTS attendance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            lecture_id TEXT, 
            student_id INTEGER, 
            status TEXT, 
            note TEXT, 
            user_id INTEGER,
            marked_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 6. Settings Table
                db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 7. Files Table
                db.run(`CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mimetype TEXT NOT NULL,
            size INTEGER NOT NULL,
            path TEXT NOT NULL,
            category TEXT NOT NULL,
            uploaded_by INTEGER NOT NULL,
            related_id INTEGER,
            related_type TEXT,
            description TEXT,
            is_public INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 8. Resources Table
                db.run(`CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            subject TEXT,
            class_year TEXT,
            file_path TEXT,
            file_type TEXT,
            is_public INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 9. Leave Requests Table
                db.run(`CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT NOT NULL,
            notes TEXT,
            affected_lectures TEXT,
            leave_type TEXT DEFAULT 'casual',
            status TEXT DEFAULT 'pending',
            approved_by INTEGER,
            rejection_reason TEXT,
            denial_reason TEXT,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            hod_decision_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // Migration for leave_requests
                db.run("ALTER TABLE leave_requests ADD COLUMN leave_type TEXT DEFAULT 'casual'", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.leave_type");
                });

                db.run("ALTER TABLE leave_requests ADD COLUMN notes TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.notes");
                });

                db.run("ALTER TABLE leave_requests ADD COLUMN affected_lectures TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.affected_lectures");
                });

                db.run("ALTER TABLE leave_requests ADD COLUMN submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.submitted_at");
                });

                db.run("ALTER TABLE leave_requests ADD COLUMN hod_decision_at DATETIME", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.hod_decision_at");
                });

                db.run("ALTER TABLE leave_requests ADD COLUMN denial_reason TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.denial_reason");
                });

                // HOD-specific leave request fields
                db.run("ALTER TABLE leave_requests ADD COLUMN is_hod_request INTEGER DEFAULT 0", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.is_hod_request");
                });

                db.run("ALTER TABLE leave_requests ADD COLUMN delegate_to TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added leave_requests.delegate_to");
                });

                // 9b. Substitute Assignments Table (NEW)
                db.run(`CREATE TABLE IF NOT EXISTS substitute_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leave_request_id INTEGER NOT NULL,
            lecture_id TEXT NOT NULL,
            original_teacher_id INTEGER NOT NULL,
            substitute_teacher_id INTEGER,
            assignment_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            auto_assigned INTEGER DEFAULT 0,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            confirmed_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            assignment_type TEXT DEFAULT 'manual',
            syllabus_notes TEXT,
            FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
            FOREIGN KEY (lecture_id) REFERENCES lectures(id),
            FOREIGN KEY (original_teacher_id) REFERENCES teachers(id),
            FOREIGN KEY (substitute_teacher_id) REFERENCES teachers(id)
        )`, (err) => {
                    if (!err) console.log("✅ Created substitute_assignments table");
                });

                // 10. Assignments Table
                db.run(`CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            subject TEXT NOT NULL,
            class_year TEXT NOT NULL,
            teacher_id INTEGER NOT NULL,
            due_date TEXT,
            max_marks INTEGER DEFAULT 100,
            file_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // Migration for assignments - add max_marks
                db.run("ALTER TABLE assignments ADD COLUMN max_marks INTEGER DEFAULT 100", (err) => {
                    if (!err) console.log("✨ Migrated: Added assignments.max_marks");
                });

                // 11. Submissions Table
                db.run(`CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignment_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            marks INTEGER,
            status TEXT DEFAULT 'pending',
            feedback TEXT
        )`);

                // Migration for submissions - add marks and status
                db.run("ALTER TABLE submissions ADD COLUMN marks INTEGER", (err) => {
                    if (!err) console.log("✨ Migrated: Added submissions.marks");
                });

                db.run("ALTER TABLE submissions ADD COLUMN status TEXT DEFAULT 'pending'", (err) => {
                    if (!err) console.log("✨ Migrated: Added submissions.status");
                });

                // 12. Announcements Table
                db.run(`CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            priority TEXT DEFAULT 'normal',
            target_audience TEXT DEFAULT 'all',
            is_active INTEGER DEFAULT 1,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 13. Subjects Table
                db.run(`CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE,
            department TEXT,
            semester INTEGER,
            syllabus_file TEXT
        )`);

                // 14. User Roles Table
                db.run(`CREATE TABLE IF NOT EXISTS user_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            granted_by INTEGER,
            granted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 15. Syllabus Topics Table
                db.run(`CREATE TABLE IF NOT EXISTS syllabus_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            unit_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            estimated_hours INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
        )`);

                // 16. Login Attempts Table
                db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            ip_address TEXT,
            success INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

                // 16a. Faculty Evaluations Table
                db.run(`CREATE TABLE IF NOT EXISTS faculty_evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            evaluator_id INTEGER NOT NULL,
            academic_year TEXT NOT NULL,
            performance_score INTEGER,
            teaching_quality INTEGER,
            punctuality INTEGER,
            student_feedback_score INTEGER,
            comments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES teachers (id),
            FOREIGN KEY (evaluator_id) REFERENCES teachers (id)
        )`, (err) => {
                    if (!err) console.log("✅ Created: faculty_evaluations");
                });

                // 16b. Audit Logs Table (NEW)
                db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_type TEXT,
            action TEXT NOT NULL,
            resource TEXT,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
                    if (err) console.error("❌ Error creating audit_logs table:", err.message);
                    else console.log("✅ Created: audit_logs");
                });

                // 16c. Config Audit Log (For Settings)
                db.run(`CREATE TABLE IF NOT EXISTS config_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            action TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_by INTEGER,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
                    if (!err) console.log("✅ Created: config_audit");
                });

                // 16d. Config Templates
                db.run(`CREATE TABLE IF NOT EXISTS config_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            config_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
                    if (!err) {
                        console.log("✅ Created: config_templates");
                        // Insert a default template if none exist
                        db.get("SELECT COUNT(*) as count FROM config_templates", [], (checkErr, row) => {
                            if (!checkErr && row.count === 0) {
                                const defaultConfig = JSON.stringify({
                                    academic_years: [
                                        { code: 'FY', name: 'First Year', sort_order: 1 },
                                        { code: 'SY', name: 'Second Year', sort_order: 2 },
                                        { code: 'TY', name: 'Third Year', sort_order: 3 },
                                        { code: 'BTECH', name: 'Bachelor of Technology', sort_order: 4 }
                                    ],
                                    time_slots: [
                                        { name: 'Period 1', start_time: '08:00', end_time: '09:00', slot_type: 'lecture', sort_order: 1 },
                                        { name: 'Period 2', start_time: '09:00', end_time: '10:00', slot_type: 'lecture', sort_order: 2 },
                                        { name: 'Break', start_time: '10:00', end_time: '10:30', slot_type: 'break', sort_order: 3 },
                                        { name: 'Period 3', start_time: '10:30', end_time: '11:30', slot_type: 'lecture', sort_order: 4 },
                                        { name: 'Period 4', start_time: '11:30', end_time: '12:30', slot_type: 'lecture', sort_order: 5 },
                                        { name: 'Lunch', start_time: '12:30', end_time: '13:30', slot_type: 'break', sort_order: 6 },
                                        { name: 'Period 5', start_time: '13:30', end_time: '14:30', slot_type: 'lecture', sort_order: 7 },
                                        { name: 'Period 6', start_time: '14:30', end_time: '15:30', slot_type: 'lecture', sort_order: 8 }
                                    ],
                                    divisions: [
                                        { code: 'A', name: 'Division A', sort_order: 1 },
                                        { code: 'B', name: 'Division B', sort_order: 2 },
                                        { code: 'C', name: 'Division C', sort_order: 3 },
                                        { code: 'D', name: 'Division D', sort_order: 4 }
                                    ]
                                });
                                db.run(`INSERT INTO config_templates (name, description, type, config_data) VALUES (?, ?, ?, ?)`,
                                    ['Standard College Preset', 'Standard configuration for Mumbai University affiliated colleges. Includes standard 6-period day and standard class years (FY, SY, TY).', 'Standard', defaultConfig]);
                                console.log('⚙️ Default config template inserted');
                            }
                        });
                    }
                });

                // Migration for subjects
                db.run("ALTER TABLE subjects ADD COLUMN class_year TEXT", (err) => {
                    if (!err) console.log("✨ Migrated: Added subjects.class_year");
                });


                // One-time initialization for default settings if empty
                db.get("SELECT COUNT(*) as count FROM settings", [], (err, row) => {
                    if (!err && row.count === 0) {
                        const stmt = db.prepare("INSERT INTO settings (key, value, description) VALUES (?, ?, ?)");
                        stmt.run('attendance_threshold', '75', 'Minimum attendance percentage required');
                        stmt.run('grading_scale', 'standard', 'Grading system (standard/gpa)');
                        stmt.run('notification_frequency', 'daily', 'Frequency of system notifications');
                        stmt.run('org_name', 'LecMan', 'Organization display name');
                        stmt.run('org_code', 'MEC-2025', 'Organization code');
                        stmt.run('admin_email', 'admin@college.edu', 'Primary admin email');
                        stmt.run('support_phone', '+91 00000 00000', 'Support contact number');
                        stmt.run('academic_year', '2025-2026', 'Current academic year');
                        stmt.run('current_semester', 'Even Semester', 'Current running semester');
                        stmt.run('auto_approval_minutes', '30', 'Auto-approval timer for leave requests');
                        stmt.run('auto_assignment_minutes', '15', 'Auto-assignment timer for substitutes');
                        stmt.run('maintenance_mode', 'false', 'System maintenance mode toggle');
                        stmt.finalize();
                        console.log('⚙️  Default settings initialized');
                    }
                });

                // Ensure new keys exist for older databases that already have some settings
                const ensureSettings = [
                    ['org_name', 'LecMan', 'Organization display name'],
                    ['org_code', 'MEC-2025', 'Organization code'],
                    ['admin_email', 'admin@college.edu', 'Primary admin email'],
                    ['support_phone', '+91 00000 00000', 'Support contact number'],
                    ['academic_year', '2025-2026', 'Current academic year'],
                    ['current_semester', 'Even Semester', 'Current running semester'],
                    ['auto_approval_minutes', '30', 'Auto-approval timer for leave requests'],
                    ['auto_assignment_minutes', '15', 'Auto-assignment timer for substitutes'],
                    ['maintenance_mode', 'false', 'System maintenance mode toggle'],
                    ['allow_registrations', 'false', 'Self-service registration toggle'],
                ];
                ensureSettings.forEach(([key, value, desc]) => {
                    db.run("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)", [key, value, desc]);
                });

                // 17. Config Tables
                // 17. Config Tables
                // Departments Table
                db.run(`CREATE TABLE IF NOT EXISTS departments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    short_name TEXT,
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Migration for config tables
                const configTables = ['departments', 'academic_years', 'time_slots', 'divisions', 'rooms', 'designations'];
                configTables.forEach(table => {
                    db.run(`ALTER TABLE ${table} ADD COLUMN sort_order INTEGER DEFAULT 0`, (err) => {
                        if (!err) console.log(`✨ Migrated: Added ${table}.sort_order`);
                    });
                });

                // Academic Years (Class Years)
                db.run(`CREATE TABLE IF NOT EXISTS academic_years (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    display_name TEXT,
                    sort_order INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Time Slots
                db.run(`CREATE TABLE IF NOT EXISTS time_slots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    slot_type TEXT DEFAULT 'lecture',
                    sort_order INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Divisions
                db.run(`CREATE TABLE IF NOT EXISTS divisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    sort_order INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Rooms
                db.run(`CREATE TABLE IF NOT EXISTS rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    building TEXT,
                    floor INTEGER,
                    capacity INTEGER DEFAULT 60,
                    room_type TEXT DEFAULT 'classroom',
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // System Configuration
                db.run(`CREATE TABLE IF NOT EXISTS system_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL,
                    data_type TEXT DEFAULT 'string',
                    category TEXT,
                    description TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // Designations
                db.run(`CREATE TABLE IF NOT EXISTS designations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    sort_order INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // ─────────────────────────────────────────────────────────────
                // Seed realistic config data (INSERT OR IGNORE for safety)
                // ─────────────────────────────────────────────────────────────
                const seedDepartments = [
                    ['CS', 'Computer Science'],
                    ['IT', 'Information Technology'],
                    ['EXTC', 'Electronics & Telecom'],
                    ['MECH', 'Mechanical Engineering'],
                    ['CIVIL', 'Civil Engineering'],
                    ['AIDS', 'AI & Data Science'],
                ];
                seedDepartments.forEach(([code, name]) => {
                    db.run("INSERT OR IGNORE INTO departments (code, name) VALUES (?, ?)", [code, name]);
                });

                const seedAcademicYears = [
                    ['FE', 'First Year', 'FE', 1],
                    ['SE', 'Second Year', 'SE', 2],
                    ['TE', 'Third Year', 'TE', 3],
                    ['BE', 'Final Year', 'BE', 4],
                ];
                seedAcademicYears.forEach(([code, name, display, order]) => {
                    db.run("INSERT OR IGNORE INTO academic_years (code, name, display_name, sort_order) VALUES (?, ?, ?, ?)", [code, name, display, order]);
                });

                const seedTimeSlots = [
                    ['Period 1', '08:00', '10:00', 'practical', 1],
                    ['Short Break', '10:00', '10:15', 'break', 2],
                    ['Period 2', '10:15', '11:15', 'lecture', 3],
                    ['Period 3', '11:15', '12:15', 'lecture', 4],
                    ['Lunch Break', '12:15', '12:45', 'break', 5],
                    ['Period 4', '12:45', '13:45', 'lecture', 6],
                    ['Period 5', '13:45', '14:45', 'lecture', 7],
                ];
                seedTimeSlots.forEach(([name, start, end, type, order]) => {
                    db.run("INSERT OR IGNORE INTO time_slots (name, start_time, end_time, slot_type, sort_order) VALUES (?, ?, ?, ?, ?)", [name, start, end, type, order]);
                });

                const seedDivisions = [
                    ['A', 'Division A'],
                    ['B', 'Division B'],
                    ['C', 'Division C'],
                ];
                seedDivisions.forEach(([code, name]) => {
                    db.run("INSERT OR IGNORE INTO divisions (code, name) VALUES (?, ?)", [code, name]);
                });

                const seedRooms = [
                    ['LH-101', 'Lecture Hall 101', 'Main Building', 1, 120, 'lecture_hall'],
                    ['LH-102', 'Lecture Hall 102', 'Main Building', 1, 120, 'lecture_hall'],
                    ['CR-201', 'Classroom 201', 'Block A', 2, 60, 'classroom'],
                    ['CR-202', 'Classroom 202', 'Block A', 2, 60, 'classroom'],
                    ['CR-301', 'Classroom 301', 'Block B', 3, 60, 'classroom'],
                    ['LAB-01', 'Computer Lab 1', 'Block C', 1, 40, 'lab'],
                    ['LAB-02', 'Computer Lab 2', 'Block C', 1, 40, 'lab'],
                ];
                seedRooms.forEach(([code, name, building, floor, capacity, type]) => {
                    db.run("INSERT OR IGNORE INTO rooms (code, name, building, floor, capacity, room_type) VALUES (?, ?, ?, ?, ?, ?)", [code, name, building, floor, capacity, type]);
                });

                const seedDesignations = [
                    ['HOD', 'Head of Department', 1],
                    ['PROF', 'Professor', 2],
                    ['ASSOC_PROF', 'Associate Professor', 3],
                    ['ASST_PROF', 'Assistant Professor', 4],
                    ['LECTURER', 'Lecturer', 5],
                ];
                seedDesignations.forEach(([code, name, order]) => {
                    db.run("INSERT OR IGNORE INTO designations (code, name, sort_order) VALUES (?, ?, ?)", [code, name, order]);
                });

                // ─────────────────────────────────────────────────────────────
                // E12: Performance Indexes
                // These indexes speed up frequently-queried columns.
                // ─────────────────────────────────────────────────────────────
                db.run("CREATE INDEX IF NOT EXISTS idx_attendance_lecture ON attendance_records(lecture_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_notifications_teacher ON notifications(target_teacher_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_lectures_scheduled_teacher ON lectures(scheduled_teacher_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_lectures_day_of_week ON lectures(day_of_week)");
                db.run("CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email)");
                db.run("CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher ON leave_requests(teacher_id)");
                db.run("CREATE INDEX IF NOT EXISTS idx_students_class_dept ON students(class_year, department)");

                console.log('✅ Tables Validated');
                resolve();
            });
        });
    });
});

const getDB = () => db;

module.exports = { db, initDB, getDB };
