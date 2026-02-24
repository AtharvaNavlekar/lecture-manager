const { db } = require('../config/db');

console.log('🔧 IMPLEMENTING SUBSTITUTE SYSTEM DATABASE');
console.log('='.repeat(60));
console.log('');

// 1. Create leave_requests table
console.log('Creating leave_requests table...');
db.run(`
    CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        affected_lectures TEXT,
        status TEXT DEFAULT 'pending',
        hod_decision_at DATETIME,
        approved_by INTEGER,
        denial_reason TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (approved_by) REFERENCES teachers(id)
    )
`, (err) => {
    if (err) console.error('❌ Error creating leave_requests:', err.message);
    else console.log('✅ leave_requests table created\n');

    // 2. Create substitute_assignments table
    console.log('Creating substitute_assignments table...');
    db.run(`
        CREATE TABLE IF NOT EXISTS substitute_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lecture_id INTEGER NOT NULL,
            original_teacher_id INTEGER NOT NULL,
            substitute_teacher_id INTEGER,
            leave_request_id INTEGER,
            assignment_type TEXT DEFAULT 'manual',
            notified_teachers TEXT,
            response_deadline DATETIME,
            assigned_at DATETIME,
            acceptance_time INTEGER,
            is_syllabus_request INTEGER DEFAULT 0,
            syllabus_notes TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (lecture_id) REFERENCES lectures(id),
            FOREIGN KEY (original_teacher_id) REFERENCES teachers(id),
            FOREIGN KEY (substitute_teacher_id) REFERENCES teachers(id),
            FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating substitute_assignments:', err.message);
        else console.log('✅ substitute_assignments table created\n');

        // 3. Create substitute_responses table
        console.log('Creating substitute_responses table...');
        db.run(`
            CREATE TABLE IF NOT EXISTS substitute_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                response TEXT,
                responded_at DATETIME,
                response_time INTEGER,
                FOREIGN KEY (assignment_id) REFERENCES substitute_assignments(id),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id)
            )
        `, (err) => {
            if (err) console.error('❌ Error creating substitute_responses:', err.message);
            else console.log('✅ substitute_responses table created\n');

            // 4. Add substitute tracking column to teachers
            console.log('Adding substitute_count to teachers table...');
            db.run('ALTER TABLE teachers ADD COLUMN substitute_count INTEGER DEFAULT 0', (err) => {
                if (err && !err.message.includes('duplicate')) {
                    console.error('❌ Error adding substitute_count:', err.message);
                } else {
                    console.log('✅ substitute_count column added\n');
                }

                // 5. Verify tables
                console.log('Verifying tables...');
                db.all(`
                    SELECT name FROM sqlite_master 
                    WHERE type='table' 
                    AND name IN ('leave_requests', 'substitute_assignments', 'substitute_responses')
                    ORDER BY name
                `, (err, tables) => {
                    console.log('\n' + '='.repeat(60));
                    console.log('VERIFICATION:');
                    console.log('='.repeat(60));

                    if (tables && tables.length === 3) {
                        console.log('✅ All 3 substitute system tables created successfully!');
                        tables.forEach(t => console.log(`   - ${t.name}`));
                    } else {
                        console.log(`⚠️ Only ${tables ? tables.length : 0}/3 tables found`);
                    }

                    console.log('\n' + '='.repeat(60));
                    console.log('✅ DATABASE SETUP COMPLETE');
                    console.log('='.repeat(60));
                    console.log('\nNext: Implement API endpoints and UI\n');

                    db.close();
                });
            });
        });
    });
});
