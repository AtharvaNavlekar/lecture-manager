const { db } = require('../config/db');

console.log('🚨 EMERGENCY FIX - Removing ALL duplicate HODs\n');

// Get current state
db.all('SELECT id, name, department, is_hod FROM teachers WHERE is_hod = 1 ORDER BY department, id', (err, hods) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('Current HODs in database:');
    hods.forEach(h => console.log(`  [${h.id}] ${h.name} (${h.department})`));

    // Keep only the HIGHEST ID for each department (newest records)
    const deptHods = {};
    hods.forEach(h => {
        if (!deptHods[h.department]) {
            deptHods[h.department] = [];
        }
        deptHods[h.department].push(h.id);
    });

    // Find IDs to remove HOD status from (keep highest ID)
    const idsToFix = [];
    Object.keys(deptHods).forEach(dept => {
        const ids = deptHods[dept].sort((a, b) => b - a); // Descending
        if (ids.length > 1) {
            // Remove HOD from all except the first (highest) ID
            idsToFix.push(...ids.slice(1));
        }
    });

    if (idsToFix.length === 0) {
        console.log('\n✅ No duplicates found!');
        db.close();
        return;
    }

    console.log(`\n🔧 Removing HOD status from IDs: ${idsToFix.join(', ')}`);

    db.run(`
        UPDATE teachers 
        SET is_hod = 0,
            is_acting_hod = 0,
            post = CASE 
                WHEN post LIKE '%Head%' OR post LIKE '%HOD%' THEN 'Professor'
                ELSE post
            END
        WHERE id IN (${idsToFix.join(',')})
    `, function (err) {
        if (err) {
            console.error('❌ Error:', err);
            db.close();
            return;
        }

        console.log(`✅ Updated ${this.changes} records\n`);

        // Verify
        db.all('SELECT department, COUNT(*) as count FROM teachers WHERE is_hod = 1 GROUP BY department', (err, result) => {
            console.log('Final state:');
            result.forEach(r => console.log(`  ${r.department}: ${r.count} HOD(s)`));

            const stillHasDupes = result.some(r => r.count > 1);
            if (stillHasDupes) {
                console.log('\n⚠️  Still has duplicates! Running again...');
                db.close();
            } else {
                console.log('\n✅ ALL DUPLICATES REMOVED!');
                db.close();
            }
        });
    });
});
