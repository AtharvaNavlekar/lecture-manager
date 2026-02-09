const { db } = require('./config/db');

console.log('🔍 Checking Student & Analytics Data\n');

// Check students
db.get("SELECT COUNT(*) as total FROM students", [], (err, row) => {
    console.log('📊 STUDENT COUNT:');
    console.log(`  Total in database: ${row.total}`);
    console.log(`  Expected: 2160 (360 per department × 6)`);
    console.log('');

    if (row.total !== 2160) {
        console.log('  ⚠️  ISSUE: Student count mismatch!');
        console.log('  Need to import student data from sample_data/Student Management');
        console.log('');
    }

    // Breakdown by department
    db.all("SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY department", [], (err2, depts) => {
        console.log('📋 Students by Department:');
        depts.forEach(d => {
            console.log(`  ${d.department}: ${d.count} students`);
        });
        console.log('');

        // Check lectures (for analytics)
        db.get("SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM lectures", [], (err3, lectureStats) => {
            console.log('📊 LECTURE STATS:');
            console.log(`  Total lectures: ${lectureStats.total}`);
            console.log(`  Completed: ${lectureStats.completed}`);
            console.log(`  Status=scheduled: ${lectureStats.total - lectureStats.completed}`);
            console.log('');

            // Check assignments
            db.get("SELECT COUNT(*) as total FROM assignments", [], (err4, assignStats) => {
                console.log('📝 ASSIGNMENT STATS:');
                console.log(`  Total assignments: ${assignStats.total}`);
                console.log('');

                console.log('💡 DIAGNOSIS:');
                if (row.total < 2160) {
                    console.log('  ❌ Students not fully imported - only', row.total, 'of 2160');
                    console.log('  → Import student files from sample_data/Student Management/');
                }
                if (lectureStats.completed === 0) {
                    console.log('  ℹ️  No completed lectures yet (all scheduled) - this is normal for fresh data');
                }
                if (assignStats.total === 0) {
                    console.log('  ℹ️  No assignments created yet - Analytics will show zeros');
                }

                process.exit(0);
            });
        });
    });
});
