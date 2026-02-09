const { initDB, getDB } = require('./server/config/db');

initDB();
const db = getDB();

setTimeout(() => {
    console.log("--- Checking Lectures ---");
    db.all("SELECT id, date, subject, teacher_id FROM lectures LIMIT 5", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);

        console.log("\n--- Checking Leave Requests ---");
        db.all("SELECT id, start_date, end_date, teacher_id FROM leave_requests LIMIT 5", [], (err, rows) => {
            if (err) console.error(err);
            else console.log(rows);
            process.exit();
        });
    });
}, 1000);
