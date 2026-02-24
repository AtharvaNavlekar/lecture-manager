const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../server/database.sqlite');

db.serialize(() => {
    console.log("Checking recent lectures...");
    db.all("SELECT id, date, subject, class_year, scheduled_teacher_id FROM lectures ORDER BY id DESC LIMIT 10", (err, rows) => {
        if (err) {
            console.error("Error:", err);
            return;
        }
        console.log("Recent Lectures:", JSON.stringify(rows, null, 2));

        // Check for specific week Jan 5 2026
        console.log("Checking lectures for 2026-01-05 to 2026-01-09...");
        db.all("SELECT * FROM lectures WHERE date BETWEEN '2026-01-05' AND '2026-01-09'", (err, rows) => {
            console.log("Found:", rows.length);
            if (rows.length > 0) console.log("Sample:", JSON.stringify(rows.slice(0, 3), null, 2));
        });

        // Check teacher check
        db.all("SELECT id, email FROM teachers LIMIT 5", (err, tRows) => {
            console.log("Teachers:", JSON.stringify(tRows, null, 2));
        });
    });
});
