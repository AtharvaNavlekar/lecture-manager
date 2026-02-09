const { db } = require('./config/db');

db.all("SELECT COUNT(*) as total, COUNT(date) as with_date, COUNT(*) - COUNT(date) as null_dates FROM lectures", [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('📊 Lecture Database Status:');
        console.log(rows[0]);
    }

    db.all("SELECT id, subject, class_year, date, start_time FROM lectures LIMIT 5", [], (err2, lectures) => {
        if (err2) {
            console.error('Error:', err2);
        } else {
            console.log('\n📋 Sample Lectures:');
            lectures.forEach(l => console.log(l));
        }
        process.exit(0);
    });
});
