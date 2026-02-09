const { db } = require('./config/db');

// Test that we're using the right database instance
console.log('🔍 Testing Database Connection\n');

db.get("SELECT id, name, email, department FROM teachers WHERE id = 1", [], (err, admin) => {
    if (err) {
        console.error('❌ Database error:', err);
        process.exit(1);
    }

    if (!admin) {
        console.error('❌ Admin user (ID=1) not found in database!');
        process.exit(1);
    }

    console.log('✅ Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Department: ${admin.department}`);
    console.log('');

    // Now check what the analytics controller would use
    const { db: analyticsDb } = require('./controllers/analyticsController.js');

    console.log('🔍 Checking if analyticsController uses same db instance...');
    console.log(`   Main db: ${typeof db}`);
    console.log(`   Analytics would use: ${typeof analyticsDb}`);

    if (!analyticsDb) {
        console.log('   ⚠️  analyticsController imports from "./config/db" directly');

        // Test the import
        const { db: testDb } = require('./config/db');
        testDb.get("SELECT COUNT(*) as c FROM teachers", [], (err2, result) => {
            console.log(`   Test query result: ${result.c} teachers`);

            if (result.c !== 49) {
                console.log('   ❌ WRONG DATABASE! Expected 49 teachers');
            } else {
                console.log('   ✅ Correct database');
            }
            process.exit(0);
        });
    }
});
