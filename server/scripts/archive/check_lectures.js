const { db } = require('../config/db');

console.log("🔍 Checking Lecture Data...\n");

// Check total lectures
db.get("SELECT COUNT(*) as total FROM lectures", [], (err, row) => {
    console.log(`Total Lectures in DB: ${row.total}`);
});

// Check lectures for this week
db.all(`
    SELECT date, COUNT(*) as count 
    FROM lectures 
    WHERE date >= '2026-01-12' AND date <= '2026-01-16'
    GROUP BY date
    ORDER BY date
`, [], (err, rows) => {
    console.log("\n📅 Lectures by Date:");
    rows.forEach(r => console.log(`  ${r.date}: ${r.count} lectures`));
});

// Sample lectures
db.all(`
    SELECT l.*, t.name as teacher_name, t.department 
    FROM lectures l
    JOIN teachers t ON l.scheduled_teacher_id = t.id
    WHERE date = '2026-01-12'
    ORDER BY start_time
    LIMIT 10
`, [], (err, rows) => {
    console.log("\n📋 Sample Lectures (Monday Jan 12):");
    rows.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.start_time}-${r.end_time} | ${r.subject} ${r.class_year}-${r.division} | ${r.teacher_name} (${r.department}) | Room ${r.room}`);
    });
});

// Check departments
setTimeout(() => {
    db.all("SELECT DISTINCT department FROM teachers ORDER BY department", [], (err, rows) => {
        console.log("\n🏢 Teacher Departments:");
        rows.forEach(r => console.log(`  - ${r.department}`));
    });
}, 500);
