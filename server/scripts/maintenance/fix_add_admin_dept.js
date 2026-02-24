const { db } = require('./config/db');

console.log('🔧 FIXING: Adding Admin Department\n');

db.run(`
    INSERT INTO departments (code, name, is_active, sort_order)
    VALUES ('Admin', 'Administration', 1, 999)
`, [], (err) => {
    if (err) {
        console.error('❌ Error adding Admin department:', err.message);
        if (err.message.includes('UNIQUE constraint')) {
            console.log('   Admin department already exists');
        }
    } else {
        console.log('✅ Added Admin department to departments table');
    }

    // Verify
    db.all("SELECT * FROM departments ORDER BY sort_order", [], (err2, depts) => {
        console.log('\n📋 All Departments:');
        depts.forEach(d => {
            console.log(`   ${d.sort_order}. ${d.code}: ${d.name} (active=${d.is_active})`);
        });
        process.exit(0);
    });
});
