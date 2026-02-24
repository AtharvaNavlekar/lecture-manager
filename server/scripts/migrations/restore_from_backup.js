const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

console.log('🔄 RESTORING FROM BACKUP');
console.log('========================\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to connect:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database\n');
});

// Check if backup exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='lectures_backup'", [], (err, row) => {
    if (err || !row) {
        console.error('❌ Backup table not found. Nothing to restore.');
        db.close();
        process.exit(1);
    }

    console.log('✅ Backup table found\n');
    console.log('📋 Step 1/3: Dropping current lectures table...');

    db.run('DROP TABLE IF EXISTS lectures', (err) => {
        if (err) {
            console.error('❌ Failed to drop table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Current table dropped\n');

        console.log('📋 Step 2/3: Renaming backup to lectures...');
        db.run('ALTER TABLE lectures_backup RENAME TO lectures', (err) => {
            if (err) {
                console.error('❌ Restore failed:', err.message);
                db.close();
                process.exit(1);
            }
            console.log('✅ Table restored from backup\n');

            // Verify
            db.get('SELECT COUNT(*) as count FROM lectures', [], (err, row) => {
                if (err) {
                    console.error('❌ Verification failed:', err.message);
                } else {
                    console.log(`✅ Verification: ${row.count} lectures restored\n`);
                }

                console.log('============================================');
                console.log('✅ RESTORE COMPLETED!');
                console.log('============================================\n');

                db.close(() => process.exit(0));
            });
        });
    });
});
