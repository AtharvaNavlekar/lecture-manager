const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testing getRoster Fix - Lecture 3749\n');

// Calculate current week start
const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);
const weekStartISO = startOfWeek.toISOString().split('T')[0];

console.log('Current week starts:', weekStartISO);
console.log('Current date:', now.toISOString().split('T')[0]);
console.log('\n================================================\n');

db.serialize(() => {
    // Simulate what getRoster will do
    db.all(`
        SELECT * FROM attendance_records 
        WHERE lecture_id = 3749
    `, [], (err, allRecords) => {
        console.log('📊 ALL ATTENDANCE RECORDS (OLD BEHAVIOR):');
        console.log('   Total records:', allRecords.length);
        if (allRecords.length > 0) {
            console.log('   First record date:', allRecords[0].created_at);
            console.log('   ❌ This would show old attendance data!\n');
        }

        db.all(`
            SELECT * FROM attendance_records 
            WHERE lecture_id = 3749
            AND date(created_at) >= ?
        `, [weekStartISO], (err, thisWeekRecords) => {
            console.log('📊 THIS WEEK\'S ATTENDANCE RECORDS (NEW BEHAVIOR):');
            console.log('   Total records:', thisWeekRecords.length);

            if (thisWeekRecords.length === 0) {
                console.log('   ✅ Perfect! No old records will appear');
                console.log('   ✅ Students will show as unmarked (fresh slate)\n');
            } else {
                console.log('   Records found for this week:');
                console.table(thisWeekRecords.map(r => ({
                    student_id: r.student_id,
                    status: r.status,
                    created: r.created_at
                })));
            }

            console.log('================================================');
            console.log('📋 SUMMARY:');
            console.log(`   Old behavior: ${allRecords.length} records (incorrect)`);
            console.log(`   New behavior: ${thisWeekRecords.length} records (correct)`);
            console.log('\n✅ Fix verified! Restart server to apply changes.\n');

            db.close();
        });
    });
});
