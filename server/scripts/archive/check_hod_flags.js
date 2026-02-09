const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== CHECKING HOD USER OBJECT ===\n');

db.get("SELECT id, email, name, department, is_hod, role FROM teachers WHERE email = 'hod.it@college.edu'", [], (err, hod) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('HOD Account Details:');
    console.log(JSON.stringify(hod, null, 2));
    console.log('\n');

    if (hod.is_hod === 1) {
        console.log('✅ is_hod flag is SET (value: 1)');
    } else {
        console.log('❌ is_hod flag is NOT set (value:', hod.is_hod, ')');
        console.log('\n🔧 FIXING: Setting is_hod = 1 for hod.it@college.edu');

        db.run("UPDATE teachers SET is_hod = 1 WHERE email = 'hod.it@college.edu'", [], (err2) => {
            if (err2) {
                console.error('Failed to update:', err2);
            } else {
                console.log('✅ Successfully updated is_hod flag');
                console.log('\n⚠️  USER MUST RE-LOGIN for this to take effect!');
            }
            db.close();
        });
        return;
    }

    console.log('\nFrontend should receive this user object:');
    console.log('{');
    console.log(`  id: ${hod.id},`);
    console.log(`  email: "${hod.email}",`);
    console.log(`  name: "${hod.name}",`);
    console.log(`  department: "${hod.department}",`);
    console.log(`  is_hod: ${hod.is_hod === 1 ? 'true' : 'false'},`);
    console.log(`  role: "${hod.role || 'teacher'}"`);
    console.log('}');

    console.log('\nIn Analytics.jsx, the check:');
    console.log(`if (user.is_hod || user.role === 'admin') {`);
    console.log(`  // Should be: ${hod.is_hod === 1 || hod.role === 'admin' ? 'TRUE - show dept data' : 'FALSE - show personal data'}`);
    console.log('}');

    db.close();
});
