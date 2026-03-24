const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

async function hydrateAnalytics() {
    console.log('--- Starting Analytics Data Hydration ---');

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            try {
                // 1. Mark some recent lectures as 'completed'
                const today = new Date();
                console.log(`Current Date: ${today.toISOString()}`);
                
                for (let i = 0; i < 14; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    
                    // Mark roughly 80% of lectures on this date as completed
                    const query = `
                        UPDATE lectures 
                        SET status = 'completed', 
                            attendance_count = CAST(RANDOM() % 20 + 40 AS INTEGER) 
                        WHERE date = ? AND abs(random()) % 10 < 8
                    `;
                    db.run(query, [dateStr], function(err) {
                        if (err) console.error(`Error updating lectures for ${dateStr}:`, err);
                        // else console.log(`Updated ${this.changes} lectures for ${dateStr}`);
                    });
                }
                console.log('✅ Marked past 14 days of lectures as completed.');

                // 2. Insert mock assignments
                const assignmentQuery = `
                    INSERT INTO assignments (title, description, subject, class_year, teacher_id, due_date, max_marks)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                const subjects = ['Foundation Course', 'Financial Accounting I', 'Business Mathematics', 'Business Statistics'];
                const teacherIds = [1, 2, 3, 4, 5]; // From previous query

                subjects.forEach((subject, idx) => {
                    const teacherId = teacherIds[idx % teacherIds.length];
                    const dueDate = new Date(today);
                    dueDate.setDate(today.getDate() - (idx * 2)); // Past due dates
                    
                    db.run(assignmentQuery, [
                        `Assignment ${idx + 1} - ${subject}`,
                        'Complete all questions in the provided PDF.',
                        subject,
                        'FY',
                        teacherId,
                        dueDate.toISOString().split('T')[0],
                        100
                    ], function(err) {
                        if (err) console.error('Error inserting assignment:', err);
                        else {
                            const assignmentId = this.lastID;
                            // Insert submissions (approximating graded status since there is no graded column, wait the controller checks grading progress so let's see...)
                            // Wait, the controller queries: SELECT COUNT(*) as total, 0 as graded FROM assignments WHERE teacher_id IN (...)
                            // That means graded is hardcoded as 0! Let's insert the assignment anyway.
                        }
                    });
                });
                console.log('✅ Inserted mock assignments.');

                // 3. Insert mock leave requests
                const leaveQuery = `
                    INSERT INTO leave_requests (teacher_id, start_date, end_date, reason, leave_type, status, submitted_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                
                const leaveData = [
                    { t: 1, s: 'approved' },
                    { t: 2, s: 'pending' },
                    { t: 3, s: 'approved' },
                    { t: 4, s: 'rejected' },
                    { t: 5, s: 'approved' }
                ];

                leaveData.forEach(l => {
                    const start = new Date(today);
                    start.setDate(today.getDate() + 1);
                    const end = new Date(today);
                    end.setDate(today.getDate() + 3);

                    db.run(leaveQuery, [
                        l.t,
                        start.toISOString().split('T')[0],
                        end.toISOString().split('T')[0],
                        'Personal reasons',
                        'CL',
                        l.s,
                        today.toISOString()
                    ], function(err) {
                        if (err) console.error('Error inserting leave request:', err);
                    });
                });
                console.log('✅ Inserted mock leave requests.');

                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Error committing transaction:', err);
                        reject(err);
                    } else {
                        console.log('--- Hydration Complete ---');
                        resolve();
                    }
                });
            } catch (err) {
                db.run('ROLLBACK');
                console.error('Transaction failed, rolled back:', err);
                reject(err);
            }
        });
    });
}

hydrateAnalytics().then(() => {
    db.close();
    process.exit(0);
}).catch(err => {
    db.close();
    process.exit(1);
});
