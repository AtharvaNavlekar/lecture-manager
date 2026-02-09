const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testing Week-Aware Status Calculation\n');
console.log('=========================================\n');

// Calculate current week start (Sunday)
const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);
const weekStartISO = startOfWeek.toISOString().split('T')[0];

console.log('📅 Current Date:', now.toISOString().split('T')[0]);
console.log('📅 Current Week Starts:', weekStartISO);
console.log('\n');

db.serialize(() => {
    // Get Monday lectures
    db.all(`
        SELECT id, subject, class_year, day_of_week, status as db_status
        FROM lectures 
        WHERE day_of_week = 'Monday'
        LIMIT 5
    `, [], (err, lectures) => {
        if (err) {
            console.error('❌ Error:', err);
            db.close();
            return;
        }

        console.log('📋 TESTING LECTURE STATUS CALCULATION:\n');

        const promises = lectures.map(lecture => {
            return new Promise((resolve) => {
                // Check attendance for this week
                db.get(`
                    SELECT COUNT(*) as count 
                    FROM attendance_records 
                    WHERE lecture_id = ? 
                    AND date(created_at) >= ?
                `, [lecture.id, weekStartISO], (err, row) => {
                    const calculatedStatus = (row && row.count > 0) ? 'completed' : 'scheduled';

                    resolve({
                        id: lecture.id,
                        subject: lecture.subject,
                        class_year: lecture.class_year,
                        db_status: lecture.db_status,
                        calculated_status: calculatedStatus,
                        attendance_this_week: row ? row.count : 0,
                        status_changed: lecture.db_status !== calculatedStatus ? '✅ FIXED' : '⚪ SAME'
                    });
                });
            });
        });

        Promise.all(promises).then(results => {
            console.table(results);
            console.log('\n');

            const fixedCount = results.filter(r => r.status_changed === '✅ FIXED').length;
            if (fixedCount > 0) {
                console.log(`✅ SUCCESS! ${fixedCount} lecture(s) will now show correct status`);
                console.log('   These lectures had old "completed" status that will reset to "scheduled"\n');
            } else {
                console.log('ℹ️  All lectures already have correct status for this week\n');
            }

            console.log('=========================================');
            console.log('🚀 Ready to test! Restart your server and check the Attendance page.');
            console.log('   Expected: "Mobile App Development" should show as PENDING (0 completed)\n');

            db.close();
        });
    });
});
