const { db } = require('./config/db');

console.log('🔍 Checking for Duplicate Data\n');

// Check lecture duplicates
db.all(`
    SELECT 
        subject, 
        class_year, 
        division,
        date,
        start_time,
        COUNT(*) as count,
        GROUP_CONCAT(id) as ids
    FROM lectures
    GROUP BY subject, class_year, division, date, start_time
    HAVING count > 1
    ORDER BY count DESC
    LIMIT 20
`, [], (err, dupLectures) => {
    if (err) {
        console.error('Lecture duplicate check error:', err);
    } else {
        console.log('📚 Duplicate Lectures:');
        if (dupLectures.length === 0) {
            console.log('   ✅ No duplicate lectures');
        } else {
            console.log(`   ⚠️  Found ${dupLectures.length} sets of duplicates:\n`);
            dupLectures.forEach(d => {
                console.log(`   ${d.subject} - ${d.class_year} Div ${d.division} - ${d.date} ${d.start_time}`);
                console.log(`   Count: ${d.count}, IDs: ${d.ids}`);
                console.log('');
            });
        }
    }

    // Total counts
    db.get(`SELECT COUNT(*) as total FROM lectures`, [], (err2, total) => {
        db.get(`SELECT COUNT(DISTINCT subject || class_year || division || date || start_time) as unique FROM lectures`, [], (err3, unique) => {
            console.log('\n📊 Lecture Statistics:');
            console.log(`   Total: ${total.total}`);
            console.log(`   Unique combinations: ${unique.unique}`);
            console.log(`   Duplicates: ${total.total - unique.unique}`);

            if (total.total - unique.unique > 0) {
                console.log('\n💡 To remove duplicates, run:');
                console.log('   node remove_duplicates.js');
            }

            process.exit(0);
        });
    });
});
