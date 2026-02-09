const { db } = require('./config/db');

console.log('🔍 Testing Analytics Query (Admin perspective)\n');

// Simulate what the fixed code should return
db.all("SELECT id FROM teachers", [], (err, teachers) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log(`📊 Total teachers in database: ${teachers.length}`);

    const teacherIds = teachers.map(t => t.id);
    const placeholders = teacherIds.map(() => '?').join(',');

    db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM lectures 
        WHERE scheduled_teacher_id IN (${placeholders})
    `, teacherIds, (err2, lectureStats) => {
        if (err2) {
            console.error('Error:', err2);
            process.exit(1);
        }

        console.log('\n📊 Lecture Statistics:');
        console.log(`  Total Lectures: ${lectureStats.total}`);
        console.log(`  Completed: ${lectureStats.completed}`);
        console.log(`  Scheduled: ${lectureStats.total - lectureStats.completed}`);
        console.log('\n✅ This is what /analytics/summary SHOULD return after fix');
        console.log('   If Analytics page still shows 0, server needs restart!');

        process.exit(0);
    });
});
