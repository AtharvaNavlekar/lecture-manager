const { db } = require('../config/db');

console.log('Checking subjects table schema...\n');

db.all('PRAGMA table_info(subjects)', [], (err, cols) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('📊 Subjects table columns:');
    console.table(cols);

    db.all('SELECT sql FROM sqlite_master WHERE name="subjects"', [], (e, r) => {
        console.log('\n📋 Table DDL:');
        console.log(r[0]?.sql || 'Not found');

        db.all('SELECT COUNT(*) as count FROM subjects', [], (e2, r2) => {
            console.log('\n📊 Current subject count:', r2[0].count);

            db.all('SELECT * FROM subjects LIMIT 3', [], (e3, r3) => {
                console.log('\n📋 Sample subjects:');
                console.table(r3);
                process.exit(0);
            });
        });
    });
});
