const { db } = require('../config/db');

console.log('🔧 FIXING DIVISION IMPLEMENTATION - Including Department in Roll No');
console.log('='.repeat(70));
console.log('');

// Get all students without divisions (division IS NULL)
db.all(`
    SELECT id, name, department, class_year, roll_no
    FROM students
    WHERE division IS NULL
    ORDER BY department, class_year, id
`, (err, students) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`Found ${students.length} students without divisions\n`);

    // Group by department and class year
    const groups = {};
    students.forEach(student => {
        const key = `${student.department}-${student.class_year}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(student);
    });

    // Prepare updates with department prefix
    const updates = [];
    Object.keys(groups).forEach(key => {
        const [dept, classYear] = key.split('-');
        const group = groups[key];
        const midpoint = Math.ceil(group.length / 2);

        group.forEach((student, idx) => {
            const division = idx < midpoint ? 'A' : 'B';
            const divNum = (idx % midpoint) + 1;

            // Include department in roll number to avoid conflicts
            const deptCode = dept.substring(0, 2).toUpperCase();
            const newRollNo = `${deptCode}-${classYear}-${division}-${String(divNum).padStart(3, '0')}`;

            updates.push({
                id: student.id,
                division: division,
                roll_no: newRollNo
            });
        });
    });

    console.log(`Prepared ${updates.length} updates\n`);
    console.log('Sample roll numbers:');
    updates.slice(0, 5).forEach(u => {
        console.log(`  ID ${u.id}: ${u.roll_no} (Division ${u.division})`);
    });
    console.log('');

    // Execute updates
    console.log('Executing updates...\n');
    const stmt = db.prepare('UPDATE students SET division = ?, roll_no = ? WHERE id = ?');

    let completed = 0;
    let errors = 0;

    updates.forEach(update => {
        stmt.run(update.division, update.roll_no, update.id, (err) => {
            if (err) {
                errors++;
                if (errors <= 5) console.error(`Update error for ID ${update.id}:`, err.message);
            }
            completed++;

            if (completed === updates.length) {
                stmt.finalize();

                console.log(`\n✅ Completed ${completed} updates`);
                console.log(`   Errors: ${errors}\n`);

                // Verify
                db.all(`
                    SELECT department, class_year, division, COUNT(*) as count
                    FROM students
                    GROUP BY department, class_year, division
                    ORDER BY department, class_year, division
                `, (err, results) => {
                    console.log('FINAL DIVISION DISTRIBUTION:');
                    console.log('='.repeat(70));

                    let currentDept = null;
                    results.forEach(row => {
                        if (currentDept !== row.department) {
                            currentDept = row.department;
                            console.log(`\n${row.department}:`);
                        }
                        const divLabel = row.division || 'null';
                        console.log(`  ${row.class_year} - Division ${divLabel}: ${row.count} students`);
                    });

                    db.all(`
                        SELECT division, COUNT(*) as count
                        FROM students
                        GROUP BY division
                    `, (err, summary) => {
                        console.log('\n' + '='.repeat(70));
                        console.log('OVERALL SUMMARY:');
                        summary.forEach(row => {
                            const divLabel = row.division || 'UNASSIGNED';
                            console.log(`  Division ${divLabel}: ${row.count} students`);
                        });

                        // Check if all assigned
                        db.get('SELECT COUNT(*) as remaining FROM students WHERE division IS NULL', (err, r) => {
                            console.log('\n' + '='.repeat(70));
                            if (r.remaining === 0) {
                                console.log('🎉 SUCCESS! All 720 students have divisions!');
                            } else {
                                console.log(`⚠️  ${r.remaining} students still without divisions`);
                            }
                            console.log('='.repeat(70) + '\n');

                            db.close();
                        });
                    });
                });
            }
        });
    });
});
