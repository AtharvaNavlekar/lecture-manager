const { db } = require('../config/db');

console.log('=== CHECKING USER LECTURE ASSIGNMENTS ===\n');

// Get a sample HOD user
db.get(`
    SELECT id, name, email, department, is_hod 
    FROM teachers 
    WHERE is_hod = 1 OR name LIKE '%Head%' OR name LIKE '%HOD%'
    LIMIT 1
`, [], (err, hod) => {
    if (!hod) {
        console.log('❌ No HOD found in database');
        process.exit(1);
    }

    console.log(`👤 HOD User: ${hod.name} (ID: ${hod.id}, Dept: ${hod.department})`);
    console.log('');

    // Check how many lectures this HOD teaches
    db.all(`
        SELECT id, subject, day_of_week, start_time, class_year 
        FROM lectures 
        WHERE scheduled_teacher_id = ? OR substitute_teacher_id = ?
        LIMIT 10
    `, [hod.id, hod.id], (err, lectures) => {
        console.log(`📚 Personal lectures for ${hod.name}:`);

        if (lectures.length === 0) {
            console.log('  ❌ NO LECTURES ASSIGNED! This is why the timetable is empty.');
            console.log('');
            console.log('  To fix: Assign some lectures to this teacher in the database:');
            console.log(`  UPDATE lectures SET scheduled_teacher_id = ${hod.id} WHERE id IN (SELECT id FROM lectures LIMIT 10);`);
        } else {
            lectures.forEach(lec => {
                console.log(`  - ${lec.subject} | ${lec.day_of_week} ${lec.start_time} | ${lec.class_year}`);
            });
            console.log(`\n  ✅ Total: ${lectures.length} personal lectures`);
        }

        // Also check department-wide count
        db.all(`
            SELECT t.department, COUNT(*) as count
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ?
            GROUP BY t.department
        `, [hod.department], (err, deptCounts) => {
            console.log('');
            console.log(`📊 Department (${hod.department}) Lectures:`);
            if (deptCounts.length > 0) {
                console.log(`  Total: ${deptCounts[0].count} lectures`);
            } else {
                console.log('  No department lectures found');
            }

            db.close();
        });
    });
});
