const { db } = require('./config/db');

// Check teacher departments and lecture counts
db.all("SELECT DISTINCT t.department, COUNT(l.id) as lecture_count FROM teachers t LEFT JOIN lectures l ON t.id = l.scheduled_teacher_id GROUP BY t.department ORDER BY t.department", [], (err, depts) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('📊 Teachers by Department (with lecture counts):\n');
    depts.forEach(d => {
        console.log(`  ${d.department}: ${d.lecture_count} lectures`);
    });

    console.log('\n🔍 Checking BAF specifically:');
    db.all("SELECT id, name, email, department FROM teachers WHERE department LIKE '%BAF%' OR department LIKE '%baf%'", [], (err2, teachers) => {
        if (teachers && teachers.length > 0) {
            console.log(`  Found ${teachers.length} BAF teachers:`);
            teachers.forEach(t => console.log(`    - ${t.name} (${t.email}): dept="${t.department}"`));
        } else {
            console.log('  ⚠️  No BAF teachers found!');
        }

        console.log('\n📋 Sample lectures with teacher info:');
        db.all(`
            SELECT l.subject, l.day_of_week, t.email, t.department 
            FROM lectures l 
            JOIN teachers t ON l.scheduled_teacher_id = t.id 
            LIMIT 5
        `, [], (err3, lectures) => {
            lectures.forEach(lec => {
                console.log(`  ${lec.day_of_week} - ${lec.subject} (Teacher: ${lec.email}, Dept: ${lec.department})`);
            });
            process.exit(0);
        });
    });
});
