const { db } = require('../config/db');

console.log('=== ASSIGNING LECTURES TO HOD ===\n');

// Find the IT HOD
db.get(`
    SELECT id, name, email, department 
    FROM teachers 
    WHERE department = 'IT' AND (is_hod = 1 OR name LIKE '%Head%')
    LIMIT 1
`, [], (err, hod) => {
    if (!hod) {
        console.log('❌ IT HOD not found. Finding any IT teacher...');

        db.get(`SELECT id, name, email, department FROM teachers WHERE department = 'IT' LIMIT 1`, [], (err, teacher) => {
            if (!teacher) {
                console.log('❌ No IT teachers found!');
                process.exit(1);
            }
            assignLectures(teacher);
        });
    } else {
        assignLectures(hod);
    }
});

function assignLectures(teacher) {
    console.log(`👤 Assigning lectures to: ${teacher.name} (ID: ${teacher.id})`);
    console.log('');

    // Get some IT department lectures and assign them to this teacher
    db.all(`
        SELECT l.id, l.subject, l.day_of_week, l.start_time, t.name as current_teacher
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        WHERE t.department = 'IT'
        AND l.day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
        LIMIT 15
    `, [], (err, lectures) => {
        if (lectures.length === 0) {
            console.log('❌ No IT department lectures found!');
            db.close();
            return;
        }

        console.log(`📚 Assigning ${lectures.length} lectures to ${teacher.name}:`);

        const lectureIds = lectures.map(l => l.id);
        const placeholders = lectureIds.map(() => '?').join(',');

        db.run(`
            UPDATE lectures 
            SET scheduled_teacher_id = ? 
            WHERE id IN (${placeholders})
        `, [teacher.id, ...lectureIds], function (err) {
            if (err) {
                console.error('❌ Error assigning lectures:', err);
                db.close();
                return;
            }

            console.log(`✅ Successfully assigned ${this.changes} lectures to ${teacher.name}`);
            console.log('');
            console.log('Sample assigned lectures:');
            lectures.slice(0, 5).forEach(lec => {
                console.log(`  - ${lec.subject} | ${lec.day_of_week} ${lec.start_time}`);
            });
            console.log('');
            console.log('✅ Refresh your browser to see the timetable!');

            db.close();
        });
    });
}
