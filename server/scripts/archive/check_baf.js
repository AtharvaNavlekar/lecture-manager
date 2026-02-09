const { db } = require('../config/db');

const dept = "BAF";
const classYear = "TY";
const division = "A";

console.log(`🔍 Checking lectures for: ${dept}, ${classYear}, ${division}\n`);

db.all(`
    SELECT l.*, t.name as teacher_name, t.department
    FROM lectures l
    JOIN teachers t ON l.scheduled_teacher_id = t.id
    WHERE t.department LIKE ?
      AND l.class_year = ?
      AND l.division = ?
`, [`%${dept}%`, classYear, division], (err, rows) => {
    if (err) {
        console.error("❌ Error:", err);
    } else {
        console.log(`✅ Found ${rows.length} lectures\n`);

        if (rows.length > 0) {
            console.log("Sample lectures:");
            rows.slice(0, 5).forEach(r => {
                console.log(`  ${r.day_of_week} ${r.start_time}: ${r.subject} (${r.teacher_name})`);
            });
        } else {
            console.log("❌ No lectures found for this combination!");

            // Check what's available
            db.all(`
                SELECT DISTINCT l.class_year, l.division, COUNT(*) as count
                FROM lectures l
                JOIN teachers t ON l.scheduled_teacher_id = t.id
                WHERE t.department LIKE ?
                GROUP BY l.class_year, l.division
            `, [`%${dept}%`], (err, rows) => {
                console.log("\n📊 Available BAF lectures:");
                rows.forEach(r => {
                    console.log(`  ${r.class_year}-${r.division}: ${r.count} lectures`);
                });
            });
        }
    }

    setTimeout(() => process.exit(0), 500);
});
