const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("--- Patching Lecture Status ---");
db.serialize(() => {
    db.run(`
        UPDATE lectures 
        SET status = 'completed' 
        WHERE id IN (
            SELECT DISTINCT lecture_id FROM attendance_records
        ) AND status != 'completed'
    `, function (err) {
        if (err) console.error("Error updating lectures:", err);
        else console.log(`Updated ${this.changes} lectures to 'completed' status.`);

        db.close();
    });
});
