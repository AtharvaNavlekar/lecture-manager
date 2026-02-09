const { db } = require('../config/db');

console.log('Checking uploaded lecture data...\n');

// Check distinct class_year and division combinations
db.all(`SELECT DISTINCT class_year, division FROM lectures ORDER BY class_year, division`, (err, rows) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('📊 Class Year & Division Combinations:');
    console.log(JSON.stringify(rows, null, 2));
    console.log(`\nTotal combinations: ${rows.length}`);

    // Check this week's data
    db.all(`SELECT subject, class_year, division, date, start_time FROM lectures WHERE date >= '2026-01-06' AND date <= '2026-01-10'ORDER BY date, start_time LIMIT 20`, (err2, weekRows) => {
        console.log('\n📅 This Week (Jan 6-10):');
        console.log(JSON.stringify(weekRows, null, 2));

        // Check IT FY lectures specifically
        db.all(`SELECT subject, class_year, division, date, start_time FROM lectures WHERE class_year LIKE '%IT%' AND class_year LIKE '%FY%' LIMIT 10`, (err3, itRows) => {
            console.log('\n🎯 IT FY Lectures:');
            console.log(JSON.stringify(itRows, null, 2));
            process.exit(0);
        });
    });
});
