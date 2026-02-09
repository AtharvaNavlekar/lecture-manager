const { db } = require('../config/db');

console.log('=== CHECKING FACULTY STATUS ===\n');

// Check all faculty members
db.all(`
    SELECT id, name, email, department, is_hod, is_active, status
    FROM teachers
    ORDER BY id
`, [], (err, faculty) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log(`📊 Total faculty: ${faculty.length}\n`);

    console.log('Faculty Status:');
    console.log('='.repeat(80));

    let inactiveCount = 0;
    const inactiveIds = [];

    faculty.forEach(f => {
        const hodBadge = f.is_hod ? '👑 HOD' : '';
        const statusDisplay = f.is_active ? '✅ Active' : '❌ Inactive';
        const statusField = f.status || 'NULL';

        console.log(`${f.id.toString().padStart(3)} | ${f.name.padEnd(30)} | ${f.department.padEnd(10)} | ${statusDisplay} | Status: ${statusField} ${hodBadge}`);

        if (!f.is_active) {
            inactiveCount++;
            inactiveIds.push(f.id);
        }
    });

    console.log('='.repeat(80));
    console.log(`\n❌ Inactive faculty: ${inactiveCount}`);

    if (inactiveCount > 0) {
        console.log('\n🔧 Activating all faculty members...\n');

        db.run(`UPDATE teachers SET is_active = 1, status = 'active' WHERE is_active = 0 OR is_active IS NULL`, function (err) {
            if (err) {
                console.error('Error activating faculty:', err);
                db.close();
                return;
            }

            console.log(`✅ Activated ${this.changes} faculty members`);
            console.log('\n✅ Done! Refresh the Faculty Directory page.');
            db.close();
        });
    } else {
        console.log('\n✅ All faculty are already active!');
        db.close();
    }
});
