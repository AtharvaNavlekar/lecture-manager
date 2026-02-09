const { db } = require('../config/db');

db.all("PRAGMA table_info(subjects)", [], (err, rows) => {
    console.log("\n📊 Subjects Table Schema:");
    rows.forEach(r => console.log(`  - ${r.name}: ${r.type}`));
});
