const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');
db.configure('busyTimeout', 5000);

db.serialize(() => {
    console.log("--- CHECKING LATEST LECTURES ---");

    db.all(`
        SELECT l.id, l.subject, l.date, l.scheduled_teacher_id, t.name, t.email 
        FROM lectures l 
        LEFT JOIN teachers t ON l.scheduled_teacher_id = t.id 
        ORDER BY l.id DESC 
        LIMIT 10
    `, (err, rows) => {
        if (err) { console.error(err); return; }

        console.log(`Found ${rows.length} recent lectures.`);
        if (rows.length === 0) {
            console.log("⚠️ DB is empty of lectures. The import likely failed completely or wasn't committed.");
        } else {
            rows.forEach(r => {
                if (r.name) {
                    console.log(`✅ [ID ${r.id}] ${r.subject} -> Linked to: ${r.name} (${r.email})`);
                } else {
                    console.log(`❌ [ID ${r.id}] ${r.subject} -> Teacher ID: ${r.scheduled_teacher_id} (NOT FOUND in Teachers table)`);
                }
            });
        }

        // Also verify teacher emails to see what's expected
        console.log("\n--- EXPECTED TEACHER EMAILS (Sample) ---");
        db.all("SELECT email FROM teachers LIMIT 5", (err, tRows) => {
            tRows.forEach(t => console.log(` - ${t.email}`));
        });
    });
});

setTimeout(() => db.close(), 2000);
