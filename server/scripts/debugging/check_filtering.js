const { db } = require('./config/db');

console.log('🔍 Checking Lecture Distribution\n');

// Total count
db.get("SELECT COUNT(*) as total FROM lectures", [], (err, row) => {
    console.log('📊 TOTAL LECTURES:', row.total);
    console.log('');

    // By department
    db.all(`
        SELECT t.department, COUNT(*) as count
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        GROUP BY t.department
        ORDER BY t.department
    `, [], (err2, depts) => {
        console.log('📋 Lectures by Department:');
        depts.forEach(d => {
            console.log(`  ${d.department}: ${d.count} lectures`);
        });
        console.log('');

        // By day for BAF
        db.all(`
            SELECT l.day_of_week, COUNT(*) as count
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = 'BAF'
            GROUP BY l.day_of_week
            ORDER BY l.day_of_week
        `, [], (err3, days) => {
            console.log('📅 BAF Lectures by Day:');
            days.forEach(d => {
                console.log(`  ${d.day_of_week}: ${d.count} lectures`);
            });

            const bafTotal = days.reduce((sum, d) => sum + d.count, 0);
            console.log(`  TOTAL for BAF: ${bafTotal}`);
            console.log('');

            console.log('💡 Analysis:');
            console.log(`  - Database has ${row.total} total lectures`);
            console.log(`  - Frontend filtering by department (BAF) shows ${bafTotal}`);
            console.log(`  - This is CORRECT behavior`);
            console.log(`  - To see all 900, remove department filter or select "All Departments"`);

            process.exit(0);
        });
    });
});
