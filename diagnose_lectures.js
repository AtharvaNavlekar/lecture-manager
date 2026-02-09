const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📊 Checking Lectures Database Structure\n');
console.log('===========================================\n');

db.serialize(() => {
    // Check lectures table schema
    db.all("PRAGMA table_info(lectures)", [], (err, rows) => {
        if (err) {
            console.error('❌ Error getting lectures schema:', err);
            return;
        }
        console.log('📋 LECTURES TABLE SCHEMA:');
        console.table(rows);
        console.log('\n');
    });

    // Check attendance_records table schema
    db.all("PRAGMA table_info(attendance_records)", [], (err, rows) => {
        if (err) {
            console.error('❌ Error getting attendance_records schema:', err);
            return;
        }
        console.log('📋 ATTENDANCE_RECORDS TABLE SCHEMA:');
        console.table(rows);
        console.log('\n');
    });

    // Get sample lectures for Monday
    db.all(`
        SELECT id, subject, class_year, day_of_week, date, status, 
               attendance_count, created_at, updated_at
        FROM lectures 
        WHERE day_of_week = 'Monday'
        LIMIT 5
    `, [], (err, rows) => {
        if (err) {
            console.error('❌ Error getting Monday lectures:', err);
            return;
        }
        console.log('📅 SAMPLE MONDAY LECTURES:');
        console.table(rows);
        console.log('\n');
    });

    // Get sample attendance records
    db.all(`
        SELECT ar.*, l.subject, l.day_of_week, l.date
        FROM attendance_records ar
        JOIN lectures l ON ar.lecture_id = l.id
        WHERE l.day_of_week = 'Monday'
        LIMIT 10
    `, [], (err, rows) => {
        if (err) {
            console.error('❌ Error getting attendance records:', err);
            db.close();
            return;
        }
        console.log('📝 SAMPLE ATTENDANCE RECORDS FOR MONDAY LECTURES:');
        console.table(rows);
        console.log('\n');

        db.close(() => {
            console.log('===========================================');
            console.log('✅ Analysis complete\n');
        });
    });
});
