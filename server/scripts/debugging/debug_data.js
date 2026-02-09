const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Completed Lectures Analysis ---");
    db.all(`
        SELECT 
            id, 
            subject, 
            class_year, 
            attendance_count, 
            total_students,
            (attendance_count * 1.0 / total_students * 100) as pct
        FROM lectures 
        WHERE status = 'completed'
    `, (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\n--- Attendance Records for these lectures ---");
    db.all(`
        SELECT lecture_id, COUNT(*) as actual_records 
        FROM attendance_records 
        WHERE status = 'present' 
        GROUP BY lecture_id
    `, (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
        db.close();
    });
});
