const { db } = require('../config/db');

db.all("SELECT DISTINCT t.department, COUNT(*) as teacher_count FROM teachers t GROUP BY t.department", [], (err, teachers) => {
    console.log("\n🏢 Teacher Departments:");
    teachers.forEach(t => console.log(`  - "${t.department}": ${t.teacher_count} teachers`));
});

db.all(`
    SELECT t.department, COUNT(*) as lecture_count 
    FROM lectures l
    JOIN teachers t ON l.scheduled_teacher_id = t.id
    WHERE l.date >= '2026-01-12' AND l.date <= '2026-01-16'
    GROUP BY t.department
`, [], (err, lectures) => {
    console.log("\n📚 Lectures by Teacher Department:");
    lectures.forEach(l => console.log(`  - "${l.department}": ${l.lecture_count} lectures`));
});
