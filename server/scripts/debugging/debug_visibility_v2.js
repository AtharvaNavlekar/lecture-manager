const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Latest 5 Leave Requests ---");
    db.all("SELECT id, status, affected_lectures, notes, start_date FROM leave_requests ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\n--- Recent 5 Lectures ---");
    db.all("SELECT id, date, time_slot, subject, class_year, scheduled_teacher_id FROM lectures ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\n--- Testing needingsubstitutes Query ---");
    db.all(`
        SELECT DISTINCT
            l.id, l.subject, l.class_year, l.date, l.time_slot,
            lr.id as leave_id, lr.status, lr.affected_lectures
        FROM lectures l
        JOIN leave_requests lr ON JSON_EXTRACT(lr.affected_lectures, '$') LIKE '%' || l.id || '%'
        WHERE lr.status = 'approved'
        AND l.id NOT IN (
            SELECT lecture_id FROM substitute_assignments WHERE status = 'assigned'
        )
        ORDER BY l.date, l.time_slot
    `, (err, rows) => {
        if (err) console.error(err);
        else {
            console.log(`Found ${rows.length} lectures needing substitutes:`);
            console.table(rows);
        }
        db.close();
    });
});
