const { db } = require('../config/db');

console.log('📝 Creating Sample Attendance Records\n');

// Get a few lectures to mark attendance for
db.all('SELECT id, subject, class_year FROM lectures LIMIT 10', (err, lectures) => {
    if (err || lectures.length === 0) {
        console.error('Error:', err || 'No lectures found');
        db.close();
        return;
    }

    console.log(`Found ${lectures.length} lectures to mark attendance for\n`);

    // Get some students
    db.all('SELECT id, name, class_year FROM students LIMIT 50', (err, students) => {
        if (err || students.length === 0) {
            console.error('Error:', err || 'No students found');
            db.close();
            return;
        }

        console.log(`Found ${students.length} students\n`);

        let recordsCreated = 0;
        const stmt = db.prepare(`
            INSERT INTO attendance_records (lecture_id, student_id, status)
            VALUES (?, ?, ?)
        `);

        // Mark attendance for first 3 lectures with random present/absent
        lectures.slice(0, 3).forEach(lecture => {
            // Get students from same class year
            const classStudents = students.filter(s => s.class_year === lecture.class_year);

            classStudents.slice(0, 15).forEach(student => {
                const status = Math.random() > 0.1 ? 'present' : 'absent'; // 90% present
                stmt.run(lecture.id, student.id, status);
                recordsCreated++;
            });
        });

        stmt.finalize((err) => {
            if (err) {
                console.error('Error:', err);
            } else {
                console.log(`✅ Created ${recordsCreated} attendance records\n`);

                // Verify
                db.get('SELECT COUNT(*) as count FROM attendance_records', (err, result) => {
                    console.log(`📊 Total attendance records in database: ${result.count}\n`);
                    console.log('✅ Attendance system now has data!');
                    db.close();
                });
            }
        });
    });
});
