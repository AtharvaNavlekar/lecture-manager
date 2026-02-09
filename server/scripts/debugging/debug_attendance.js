const { db } = require('./config/db');

const lectureId = 3749; // From URL in screenshot
const classYear = 'TY';

console.log(`\n=== DEBUGGING LECTURE ${lectureId} ===\n`);

// 1. Check lecture details
db.get("SELECT * FROM lectures WHERE id = ?", [lectureId], (err, lecture) => {
    console.log('LECTURE DETAILS:');
    if (err) console.error('Error:', err);
    else if (!lecture) console.log('❌ Lecture NOT FOUND');
    else {
        console.table([lecture]);

        // 2. Check students for this class year
        db.all("SELECT id, name, roll_no, class_year, division, department FROM students WHERE class_year = ?", [classYear], (err2, students) => {
            console.log(`\nSTUDENTS FOR CLASS_YEAR "${classYear}":`);
            if (err2) console.error('Error:', err2);
            else if (students.length === 0) {
                console.log(`❌ NO STUDENTS FOUND for class_year = "${classYear}"`);

                // Check what class_year values exist
                db.all("SELECT DISTINCT class_year FROM students", [], (err3, years) => {
                    console.log('\nAVAILABLE CLASS_YEAR VALUES IN STUDENTS TABLE:');
                    console.table(years);

                    // Check total student count
                    db.get("SELECT COUNT(*) as total FROM students", [], (err4, count) => {
                        console.log(`\nTOTAL STUDENTS IN DATABASE: ${count.total}`);
                        db.close();
                    });
                });
            } else {
                console.log(`✅ Found ${students.length} students`);
                console.table(students.slice(0, 5)); // Show first 5
                db.close();
            }
        });
    }
});
