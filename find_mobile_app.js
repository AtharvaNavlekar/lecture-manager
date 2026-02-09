const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Finding Mobile App Development Lecture\n');

db.serialize(() => {
    // Search for Mobile App Development
    db.all(`
        SELECT id, subject, class_year, day_of_week, status, 
               scheduled_teacher_id, date, created_at
        FROM lectures 
        WHERE subject LIKE '%Mobile App%'
        ORDER BY id
    `, [], (err, lectures) => {
        if (err) {
            console.error('❌ Error:', err);
            db.close();
            return;
        }

        console.log('📱 MOBILE APP DEVELOPMENT LECTURES:\n');
        console.table(lectures);

        if (lectures.length > 0) {
            const lectureId = lectures[0].id;
            console.log(`\n🔎 Checking attendance records for lecture ID ${lectureId}:\n`);

            db.all(`
                SELECT id, student_id, status, 
                       date(created_at) as marked_date,
                       created_at
                FROM attendance_records 
                WHERE lecture_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [lectureId], (err, records) => {
                if (!records || records.length === 0) {
                    console.log('   No attendance records found\n');
                } else {
                    console.table(records);
                }
                db.close();
            });
        } else {
            console.log('\n❌ No Mobile App Development lectures found!\n');
            db.close();
        }
    });
});
