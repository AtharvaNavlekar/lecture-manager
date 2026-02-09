const { db } = require('../config/db');

console.log('=== CHECKING TEACHERS TABLE SCHEMA ===\n');

db.all("PRAGMA table_info(teachers)", [], (err, columns) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('Teachers table columns:');
    columns.forEach(col => {
        console.log(`  - ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    console.log('');

    const hasIsActive = columns.some(col => col.name === 'is_active');

    if (!hasIsActive) {
        console.log('❌ Missing is_active column');
        console.log('🔧 Adding is_active column...\n');

        db.run(`ALTER TABLE teachers ADD COLUMN is_active INTEGER DEFAULT 1`, (err) => {
            if (err) {
                console.error('Error adding column:', err);
                db.close();
                return;
            }

            console.log('✅ Added is_active column (default: 1 = active)');

            // Update all existing teachers to active
            db.run(`UPDATE teachers SET is_active = 1 WHERE is_active IS NULL`, function (err) {
                if (err) {
                    console.error('Error updating:', err);
                } else {
                    console.log(`✅ Set ${this.changes} teachers as active`);
                }

                console.log('\n✅ Done! Refresh Faculty Directory page.');
                db.close();
            });
        });
    } else {
        console.log('✅ is_active column exists');

        // Check current status
        db.all(`SELECT is_active, COUNT(*) as count FROM teachers GROUP BY is_active`, [], (err, stats) => {
            console.log('\nCurrent status distribution:');
            stats.forEach(s => {
                const status = s.is_active ? 'Active' : 'Inactive';
                console.log(`  ${status}: ${s.count}`);
            });

            db.close();
        });
    }
});
