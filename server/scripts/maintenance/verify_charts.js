const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("🔍 Verifying Data Integrity for HOD Charts...");

db.serialize(() => {
    // 1. Check CS Teachers
    db.all('SELECT id, name FROM teachers WHERE department = "CS"', (err, teachers) => {
        if (err) { console.error(err); return; }
        console.log(`👨‍🏫 CS Teachers Found: ${teachers.length}`);
        teachers.forEach(t => console.log(`   - ${t.id}: ${t.name}`));

        if (teachers.length === 0) return;

        const ids = teachers.map(t => t.id).join(',');

        // 2. Check Lectures for these teachers (using scheduled_teacher_id)
        const sql = `SELECT count(*) as count FROM lectures WHERE scheduled_teacher_id IN (${ids})`;
        db.get(sql, (err, row) => {
            console.log(`📅 Total Lectures for CS Dept: ${row.count}`);

            // 3. Check Status Distribution
            const sqlStatus = `SELECT status, COUNT(*) as count FROM lectures WHERE scheduled_teacher_id IN (${ids}) GROUP BY status`;
            db.all(sqlStatus, (err, rows) => {
                console.log("📊 Status Distribution:", rows);
            });
        });
    });
});
