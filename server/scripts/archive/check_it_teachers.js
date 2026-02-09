const { db } = require('../config/db');

console.log('🔍 DIRECT DATABASE CHECK - IT Department\n');

// Check what's actually in the database
db.all(`
    SELECT id, name, email, is_hod, is_acting_hod, post, is_active, status
    FROM teachers 
    WHERE department = 'IT'
    ORDER BY is_hod DESC, name
`, (err, teachers) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`Found ${teachers.length} IT teachers in database:\n`);

    teachers.forEach((t, idx) => {
        const hodBadge = t.is_hod ? '👑 HOD' : t.is_acting_hod ? '⭐ Acting' : '  ';
        const status = t.is_active ? '✅' : '❌';
        console.log(`${idx + 1}. [${t.id}] ${t.name.padEnd(30)} ${hodBadge} ${status}`);
        console.log(`   ${t.email}`);
        console.log(`   Post: ${t.post || 'N/A'}`);
        console.log('');
    });

    console.log(`\nSummary:`);
    console.log(`- Total: ${teachers.length}`);
    console.log(`- HODs: ${teachers.filter(t => t.is_hod).length}`);
    console.log(`- Acting HODs: ${teachers.filter(t => t.is_acting_hod).length}`);
    console.log(`- Active: ${teachers.filter(t => t.is_active).length}`);

    db.close();
});
