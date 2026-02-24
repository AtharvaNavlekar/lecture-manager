const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../lecture_manager.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 CREATING SUBSTITUTE SYSTEM TABLES\n');

db.serialize(() => {
    // Create leave_requests table
    db.run(`
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT,
            affected_lectures TEXT,
            status TEXT DEFAULT 'pending',
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            hod_decision_at DATETIME,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating leave_requests:', err);
        else console.log('✅ leave_requests table created');
    });

    // Create substitute_assignments table
    db.run(`
        CREATE TABLE IF NOT EXISTS substitute_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lecture_id INTEGER NOT NULL,
            original_teacher_id INTEGER NOT NULL,
            substitute_teacher_id INTEGER,
            leave_request_id INTEGER,
            assignment_type TEXT DEFAULT 'manual',
            status TEXT DEFAULT 'pending',
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            response_deadline DATETIME,
            syllabus_notes TEXT,
            FOREIGN KEY (lecture_id) REFERENCES lectures(id),
            FOREIGN KEY (original_teacher_id) REFERENCES teachers(id),
            FOREIGN KEY (substitute_teacher_id) REFERENCES teachers(id),
            FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating substitute_assignments:', err);
        else console.log('✅ substitute_assignments table created');
    });

    // Create substitute_responses table
    db.run(`
        CREATE TABLE IF NOT EXISTS substitute_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignment_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            response TEXT,
            responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignment_id) REFERENCES substitute_assignments(id),
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating substitute_responses:', err);
        else console.log('✅ substitute_responses table created');
    });

    // Add substitute_count column to teachers
    db.run(`
        ALTER TABLE teachers ADD COLUMN substitute_count INTEGER DEFAULT 0
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding substitute_count:', err.message);
        } else {
            console.log('✅ substitute_count column added to teachers');
        }

        db.close(() => {
            console.log('\n✅ DATABASE SETUP COMPLETE!');
            console.log('You can now start the server.\n');
        });
    });
});
