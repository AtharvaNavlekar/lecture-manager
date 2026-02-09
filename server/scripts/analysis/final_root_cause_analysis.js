const { db } = require('./config/db');

console.log('🔍 FINAL ROOT CAUSE ANALYSIS\n');
console.log('='.repeat(70));

// Check if departments table exists and what it contains
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
    console.log('\n📋 Available Tables:');
    tables.forEach(t => console.log(`  - ${t.name}`));

    const hasDepartmentsTable = tables.some(t => t.name === 'departments');

    if (hasDepartmentsTable) {
        console.log('\n🏢 DEPARTMENTS TABLE DATA:');
        console.log('='.repeat(70));
        db.all("SELECT * FROM departments", [], (err2, depts) => {
            if (err2) {
                console.log('  Error:', err2.message);
            } else if (depts.length === 0) {
                console.log('  ⚠️  Table exists but is EMPTY!');
            } else {
                console.log(`  Found ${depts.length} departments:`);
                depts.forEach(d => {
                    console.log(`    ${d.id}. code="${d.code}", name="${d.name}", active=${d.is_active}`);
                });
            }

            analyzeMismatch(depts || []);
        });
    } else {
        console.log('\n  ⚠️  No departments table found!');
        analyzeMismatch([]);
    }
});

function analyzeMismatch(configDepts) {
    // Check what teachers actually have
    db.all(`
        SELECT DISTINCT department, COUNT(*) as count
        FROM teachers
        WHERE department IS NOT NULL
        GROUP BY department
        ORDER BY department
    `, [], (err, teacherDepts) => {
        console.log('\n👥 TEACHER DEPARTMENTS ANALYSIS:');
        console.log('='.repeat(70));
        console.log(`  Found ${teacherDepts.length} unique department values in teachers table:\n`);

        teacherDepts.forEach(td => {
            const matchesConfig = configDepts.find(cd =>
                cd.code === td.department || cd.name === td.department
            );

            if (matchesConfig) {
                console.log(`  ✅ "${td.department}" (${td.count} teachers) → matches config ${matchesConfig.code}`);
            } else {
                console.log(`  ❌ "${td.department}" (${td.count} teachers) → NO CONFIG MATCH!`);
            }
        });

        console.log('\n💡 ROOT CAUSE IDENTIFIED:');
        console.log('='.repeat(70));

        const mismatches = teacherDepts.filter(td =>
            !configDepts.find(cd => cd.code === td.department || cd.name === td.department)
        );

        if (mismatches.length > 0) {
            console.log('  ❌ MISMATCH DETECTED!');
            console.log(`     ${mismatches.length} teacher department(s) don't match config:`);
            mismatches.forEach(m => {
                console.log(`     - "${m.department}" (${m.count} teachers)`);
            });
            console.log('\n  SOLUTION: Either:');
            console.log('     1. Add these departments to the departments table');
            console.log('     2. Update teachers to use existing department codes');
        } else {
            console.log('  ✅ All teacher departments match config');
            console.log('     The duplicate issue is in FRONTEND LOGIC');
        }

        process.exit(0);
    });
}
