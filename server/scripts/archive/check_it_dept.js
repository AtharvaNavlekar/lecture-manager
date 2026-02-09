const { db } = require('../config/db');

db.all('SELECT id, name, email, department, is_hod FROM teachers WHERE department = ? ORDER BY is_hod DESC, name', ['IT'], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('IT Department Teachers:');
        rows.forEach(r => {
            console.log(`  [${r.id}] ${r.name} (${r.email}) - is_hod: ${r.is_hod}`);
        });
    }
    db.close();
});
