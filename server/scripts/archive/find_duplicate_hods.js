const { db } = require('../config/db');

console.log('=== DUPLICATE HOD ANALYSIS ===\n');

db.all(`
    SELECT 
        department,
        COUNT(*) as hod_count,
        GROUP_CONCAT(name || ' (' || email || ')') as hods
    FROM teachers 
    WHERE is_hod = 1
    GROUP BY department
    HAVING hod_count > 1
    ORDER BY department
`, (err, duplicates) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    if (duplicates.length === 0) {
        console.log('✅ No duplicate HODs found!');
    } else {
        console.log(`❌ Found ${duplicates.length} departments with multiple HODs:\n`);
        duplicates.forEach(dept => {
            console.log(`🏢 ${dept.department}: ${dept.hod_count} HODs`);
            console.log(`   ${dept.hods}\n`);
        });
    }

    // Also show all HODs
    console.log('\n=== ALL HODs BY DEPARTMENT ===\n');
    db.all(`
        SELECT department, name, email, id, is_hod, is_acting_hod
        FROM teachers
        WHERE is_hod = 1 OR is_acting_hod = 1
        ORDER BY department, name
    `, (err, allHods) => {
        if (err) {
            console.error('Error:', err);
        } else {
            let currentDept = null;
            allHods.forEach(hod => {
                if (currentDept !== hod.department) {
                    currentDept = hod.department;
                    console.log(`\n📍 ${hod.department}:`);
                }
                console.log(`   [ID:${hod.id}] ${hod.name} (${hod.email})`);
                console.log(`           is_hod: ${hod.is_hod}, is_acting_hod: ${hod.is_acting_hod}`);
            });
        }

        db.close();
    });
});
