const { db } = require('../config/db');

async function checkData() {
    console.log("🔍 Checking Configuration Data...\n");

    const tables = ['departments', 'academic_years', 'divisions', 'rooms', 'time_slots', 'subjects'];

    for (const table of tables) {
        await new Promise((resolve) => {
            db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                if (err) {
                    console.error(`❌ ${table}: Error - ${err.message}`);
                } else {
                    console.log(`✅ ${table}: ${rows.length} records`);
                    if (rows.length > 0) {
                        console.table(rows);
                    } else {
                        console.log(`   (Empty)`);
                    }
                }
                resolve();
            });
        });
        console.log("------------------------------------------------");
    }
}

checkData().then(() => { });
