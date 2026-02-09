const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('✅ Database Connected.');
});

// Configure for performance
db.configure('busyTimeout', 3000);
db.run("PRAGMA journal_mode = WAL;");

const initDB = () => {
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
            id TEXT PRIMARY KEY, 
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
            photo_url TEXT
        )`);

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
                stmt.finalize();
                console.log('⚙️  Default settings initialized');
            }
        });

        console.log('✅ Tables Validated');
    });
};

const getDB = () => db;

module.exports = { db, initDB, getDB };
