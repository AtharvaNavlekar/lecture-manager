const { db } = require('../config/db');

console.log('=== TIMETABLE DEBUG ===\n');

// Check if lectures table has day_of_week column
db.all("PRAGMA table_info(lectures)", [], (err, columns) => {
    if (err) {
        console.error('Error checking table structure:', err);
        return;
    }

    console.log('📋 Lectures table columns:');
    columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
    });
    console.log('');

    // Check if day_of_week column exists
    const hasDayOfWeek = columns.some(col => col.name === 'day_of_week');

    if (!hasDayOfWeek) {
        console.error('❌ ERROR: day_of_week column is MISSING from lectures table!');
        console.log('This column is required for the timetable to work.');
        console.log('\nTo fix, run: ALTER TABLE lectures ADD COLUMN day_of_week TEXT;');
        process.exit(1);
    }

    // Count total lectures
    db.get("SELECT COUNT(*) as total FROM lectures", [], (err, row) => {
        console.log(`📊 Total lectures in database: ${row.total}\n`);

        // Check day_of_week distribution
        db.all(`
            SELECT day_of_week, COUNT(*) as count 
            FROM lectures 
            GROUP BY day_of_week 
            ORDER BY 
                CASE day_of_week
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    ELSE 6
                END
        `, [], (err, rows) => {
            console.log('📅 Lectures by day_of_week:');
            rows.forEach(row => {
                console.log(`  ${row.day_of_week || '(NULL)'.padEnd(10)}: ${row.count} lectures`);
            });
            console.log('');

            // Sample some lectures
            db.all(`
                SELECT id, subject, day_of_week, start_time, scheduled_teacher_id, date
                FROM lectures 
                LIMIT 10
            `, [], (err, samples) => {
                console.log('📝 Sample lectures:');
                samples.forEach(lec => {
                    console.log(`  ID ${lec.id}: ${lec.subject} | Day: ${lec.day_of_week || 'NULL'} | Time: ${lec.start_time} | Teacher: ${lec.scheduled_teacher_id} | Date: ${lec.date || 'NULL'}`);
                });
                console.log('');

                // Check teachers
                db.get("SELECT COUNT(*) as total FROM teachers", [], (err, row) => {
                    console.log(`👥 Total teachers: ${row.total}\n`);

                    db.all("SELECT id, name, email FROM teachers LIMIT 5", [], (err, teachers) => {
                        console.log('Sample teachers:');
                        teachers.forEach(t => {
                            console.log(`  ID ${t.id}: ${t.name} (${t.email})`);
                        });

                        db.close();
                    });
                });
            });
        });
    });
});
