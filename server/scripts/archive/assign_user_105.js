const { db } = require('../config/db');

const userId = 105;

console.log(`=== ASSIGNING LECTURES TO USER ${userId} ===\n`);

// Find user 105
db.get(`SELECT id, name, email, department FROM teachers WHERE id = ?`, [userId], (err, user) => {
    if (!user) {
        console.log(`❌ User ${userId} not found in database!`);
        process.exit(1);
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🏢 Department: ${user.department}\n`);

    // Get lectures from their department
    db.all(`
        SELECT l.id, l.subject, l.day_of_week, l.start_time, l.class_year, t.name as current_teacher
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        WHERE t.department = ?
        AND l.day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
        ORDER BY RANDOM()
        LIMIT 20
    `, [user.department], (err, lectures) => {
        if (lectures.length === 0) {
            console.log(`❌ No ${user.department} department lectures found!`);
            db.close();
            return;
        }

        console.log(`📚 Assigning ${lectures.length} lectures to ${user.name}:\n`);

        const lectureIds = lectures.map(l => l.id);
        const placeholders = lectureIds.map(() => '?').join(',');

        db.run(`
            UPDATE lectures 
            SET scheduled_teacher_id = ? 
            WHERE id IN (${placeholders})
        `, [userId, ...lectureIds], function (err) {
            if (err) {
                console.error('❌ Error:', err);
                db.close();
                return;
            }

            console.log(`✅ Assigned ${this.changes} lectures\n`);
            console.log('Sample lectures:');
            lectures.slice(0, 8).forEach(lec => {
                console.log(`  - ${lec.subject.padEnd(30)} | ${lec.day_of_week.padEnd(10)} ${lec.start_time} | ${lec.class_year}`);
            });
            console.log('\n✅ DONE! Refresh browser to see timetable.');

            db.close();
        });
    });
});
