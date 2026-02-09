const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Latest 5 Leave Requests ---");
    db.all("SELECT id, status, affected_lectures, notes, submitted_at FROM leave_requests ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);

        if (rows.length > 0) {
            const lastRequest = rows[0];
            let lectureIds = [];
            try {
                lectureIds = JSON.parse(lastRequest.affected_lectures || '[]');
            } catch (e) {
                console.error("Error parsing affected_lectures JSON:", e.message);
            }

            console.log("\n--- Linked Lectures ---");
            if (lectureIds.length > 0) {
                const placeholders = lectureIds.map(() => '?').join(',');
                db.all(`SELECT * FROM lectures WHERE id IN (${placeholders})`, lectureIds, (err, lectures) => {
                    if (err) console.error(err);
                    else console.table(lectures);
                });
            } else {
                console.log("No affected lectures linked.");
            }
        }
    });

    console.log("\n--- Debugging Query for Needingsubstitutes ---");
    // Replicating the query from leaveRoutes.js to see if it returns anything
    db.all(`
        SELECT DISTINCT
            l.id, l.subject, l.class_year, lr.status as leave_status
        FROM lectures l
        JOIN leave_requests lr ON lr.affected_lectures LIKE '%' || l.id || '%'
        WHERE lr.status = 'approved'
        AND l.id NOT IN (
            SELECT lecture_id FROM substitute_assignments WHERE status = 'assigned'
        )
    `, (err, rows) => {
        if (err) console.error(err);
        else {
            console.log(`Found ${rows.length} matching rows in 'needingsubstitutes' query.`);
            console.table(rows);
        }
    });
});

db.close();
