const { db } = require('./config/db');

console.log('Checking division data...\n');

// Check lectures
db.all("SELECT id, subject, class_year, division FROM lectures WHERE division IS NOT NULL LIMIT 5", [], (err, lectures) => {
    console.log('=== LECTURES ===');
    if (err) console.error(err);
    else console.table(lectures);

    // Check students
    db.all("SELECT id, name, class_year, division FROM students WHERE division IS NOT NULL LIMIT 5", [], (err2, students) => {
        console.log('\n=== STUDENTS ===');
        if (err2) console.error(err2);
        else console.table(students);

        // Check if division column exists
        db.all("PRAGMA table_info(students)", [], (err3, cols) => {
            console.log('\n=== STUDENTS TABLE STRUCTURE ===');
            console.table(cols);

            db.close();
        });
    });
});
