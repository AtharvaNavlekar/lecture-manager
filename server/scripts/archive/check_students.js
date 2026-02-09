const { db } = require('../config/db');

db.all("SELECT department, COUNT(*) as count FROM students GROUP BY department", [], (err, rows) => {
    console.log("\n📊 Students by Department:");
    rows.forEach(r => console.log(`  - "${r.department}": ${r.count} students`));

    db.get("SELECT COUNT(*) as total FROM students", [], (err, row) => {
        console.log(`\n✅ Total: ${row.total} students`);
    });
});
