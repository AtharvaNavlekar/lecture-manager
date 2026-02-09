const { db } = require('./config/db');

// Check what the frontend is querying for
const today = new Date();
const dayOfWeek = today.getDay(); // 0 = Sunday

console.log('📅 Today is:', today.toDateString());
console.log('📅 Day of week:', dayOfWeek, '(0=Sunday, 1=Monday, etc.)');
console.log('');

// Check all lectures grouped by date
db.all(`
    SELECT date, COUNT(*) as count, 
           GROUP_CONCAT(DISTINCT class_year) as years,
           GROUP_CONCAT(DISTINCT division) as divisions
    FROM lectures 
    GROUP BY date 
    ORDER BY date
`, [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('📊 Lectures by Date:');
        rows.forEach(r => {
            console.log(`  ${r.date}: ${r.count} lectures (Years: ${r.years}, Divisions: ${r.divisions})`);
        });
    }

    // Check what date Monday would be
    const monday = new Date(today);
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
    monday.setDate(today.getDate() + daysUntilMonday);

    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

    console.log('\n🔍 Frontend query check:');
    console.log(`  Days until Monday: ${daysUntilMonday}`);
    console.log(`  Monday date would be: ${mondayStr}`);

    db.get(`SELECT COUNT(*) as count FROM lectures WHERE date = ?`, [mondayStr], (err2, row) => {
        if (row) {
            console.log(`  Lectures for Monday (${mondayStr}): ${row.count}`);
        }
        process.exit(0);
    });
});
