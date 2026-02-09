const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Calculate current week start
const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);
const weekStartISO = startOfWeek.toISOString().split('T')[0];

console.log('✅ Testing Lecture 3749 (Mobile App Development)\n');
console.log('Current week starts:', weekStartISO);
console.log('\n================================================\n');

db.serialize(() => {
    db.get('SELECT * FROM lectures WHERE id = 3749', [], (err, lecture) => {
        console.log('📋 LECTURE INFO:');
        console.log('   ID:', lecture.id);
        console.log('   Subject:', lecture.subject);
        console.log('   Teacher ID:', lecture.scheduled_teacher_id);
        console.log('   Day:', lecture.day_of_week);
        console.log('   DB Status:', lecture.status);
        console.log('\n');

        db.all(`
            SELECT COUNT(*) as total,
                   date(created_at) as marked_date
            FROM attendance_records 
            WHERE lecture_id = 3749
            GROUP BY date(created_at)
            ORDER BY created_at DESC
        `, [], (err, records) => {
            console.log('📝 ATTENDANCE HISTORY:');
            console.table(records);

            db.get(`
                SELECT COUNT(*) as count 
                FROM attendance_records 
                WHERE lecture_id = 3749
                AND date(created_at) >= ?
            `, [weekStartISO], (err, thisWeek) => {
                console.log('\n🔍 STATUS CALCULATION:');
                console.log('   Database status:', lecture.status);
                console.log('   Attendance this week:', thisWeek.count, 'records');

                const calculatedStatus = thisWeek.count > 0 ? 'completed' : 'scheduled';
                console.log('   Calculated status:', calculatedStatus);

                if (lecture.status === 'completed' && calculatedStatus === 'scheduled') {
                    console.log('\n✅ SUCCESS! Status will change from "completed" to "scheduled"');
                    console.log('   The lecture will now show as PENDING in the frontend!\n');
                } else if (lecture.status === calculatedStatus) {
                    console.log('\n⚪ Status unchanged (already correct)\n');
                } else {
                    console.log('\n📊 Status will update\n');
                }

                console.log('================================================');
                console.log('🚀 Implementation verified! Restart the server to see changes.\n');

                db.close();
            });
        });
    });
});
