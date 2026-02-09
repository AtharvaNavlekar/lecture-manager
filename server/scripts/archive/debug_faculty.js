const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'lecture_manager.db');
const db = new sqlite3.Database(dbPath);

console.log('=== DATABASE SCHEMA CHECK ===\n');

// Check all tables
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) {
        console.error('Error fetching tables:', err);
        db.close();
        return;
    }

    console.log('📊 Tables in database:', tables.map(t => t.name).join(', '));
    console.log('\n');

    // Check if faculty table exists (could be named differently)
    const facultyTableNames = tables.filter(t =>
        t.name.toLowerCase().includes('teacher') ||
        t.name.toLowerCase().includes('faculty') ||
        t.name.toLowerCase().includes('user')
    );

    if (facultyTableNames.length > 0) {
        console.log('🎓 Potential faculty tables found:', facultyTableNames.map(t => t.name).join(', '));

        // Check schema of first potential faculty table
        const tableName = facultyTableNames[0].name;
        db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
                console.error(`Error fetching schema for ${tableName}:`, err);
            } else {
                console.log(`\n📋 Schema for ${tableName}:`);
                columns.forEach(col => {
                    console.log(`  - ${col.name} (${col.type})`);
                });
            }

            // Fetch all records
            db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                if (err) {
                    console.error(`Error fetching data from ${tableName}:`, err);
                } else {
                    console.log(`\n👥 Records in ${tableName} (${rows.length} total):`);
                    rows.forEach((row, idx) => {
                        console.log(`\n#${idx + 1}:`, JSON.stringify(row, null, 2));
                    });

                    // Check for duplicate HODs
                    const hodField = Object.keys(rows[0] || {}).find(k =>
                        k.includes('hod') || k.includes('HOD')
                    );

                    if (hodField) {
                        const deptField = Object.keys(rows[0] || {}).find(k =>
                            k.includes('dep') || k.includes('dept') || k.includes('Dep')
                        );

                        if (deptField) {
                            console.log(`\n🏢 HOD Analysis by Department:`);
                            const deptGroups = {};
                            rows.forEach(row => {
                                const dept = row[deptField];
                                if (!deptGroups[dept]) deptGroups[dept] = [];
                                if (row[hodField] || row.is_acting_hod) {
                                    deptGroups[dept].push({
                                        name: row.name,
                                        email: row.email,
                                        is_hod: row[hodField],
                                        is_acting_hod: row.is_acting_hod
                                    });
                                }
                            });

                            Object.keys(deptGroups).forEach(dept => {
                                if (deptGroups[dept].length > 0) {
                                    console.log(`\n  ${dept}:`);
                                    deptGroups[dept].forEach(hod => {
                                        console.log(`    - ${hod.name} (${hod.email})`);
                                        console.log(`      is_hod: ${hod.is_hod}, is_acting_hod: ${hod.is_acting_hod}`);
                                    });
                                    if (deptGroups[dept].length > 1) {
                                        console.log(`    ⚠️  WARNING: ${deptGroups[dept].length} HODs for this department!`);
                                    }
                                }
                            });
                        }
                    }
                }

                db.close();
            });
        });
    } else {
        console.log('❌ No faculty/teacher table found!');
        db.close();
    }
});
