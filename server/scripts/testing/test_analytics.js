const { db } = require('./config/db');

console.log('🔍 Simulating Analytics Query (as Admin)\n');

// Admin should see ALL lectures, not just one department
db.get("SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM lectures", [], (err, stats) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('📊 If querying ALL lectures (admin view):');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Scheduled: ${stats.total - stats.completed}`);
    console.log('');

    // Now simulate per-department (HOD view)
    db.all(`
        SELECT t.department, 
               COUNT(*) as total,
               SUM(CASE WHEN l.status='completed' THEN 1 ELSE 0 END) as completed
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        GROUP BY t.department
        ORDER BY t.department
    `, [], (err2, deptStats) => {
        console.log('📊 Lectures by Department:');
        deptStats.forEach(d => {
            console.log(`  ${d.department}: ${d.total} total, ${d.completed} completed`);
        });
        console.log('');

        console.log('💡 Analytics Issue:');
        console.log('  The /analytics/summary endpoint filters by department');
        console.log('  If user is Admin (no specific department), it might return 0');
        console.log('  Need to check if Admin role returns all lectures or just their dept');

        process.exit(0);
    });
});
