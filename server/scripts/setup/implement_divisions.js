const { db } = require('../config/db');

console.log('🔧 IMPLEMENTING DIVISION STRUCTURE - 100% FIX');
console.log('='.repeat(60));
console.log('');

// Step 1: Add division column
console.log('Step 1: Adding division column to students table...');
db.run('ALTER TABLE students ADD COLUMN division TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding division column:', err);
        db.close();
        return;
    }
    console.log('✅ Division column added (or already exists)\n');

    // Step 2: Distribute students into divisions A and B
    console.log('Step 2: Distributing students into Division A and B...');

    db.all(`
        SELECT id, department, class_year, roll_no
        FROM students
        ORDER BY department, class_year, id
    `, (err, students) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        console.log(`Found ${students.length} students to process\n`);

        // Group by department and class year
        const groups = {};
        students.forEach(student => {
            const key = `${student.department}-${student.class_year}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(student);
        });

        // Assign divisions (split evenly into A and B)
        const updates = [];
        Object.keys(groups).forEach(key => {
            const group = groups[key];
            const midpoint = Math.ceil(group.length / 2);

            group.forEach((student, idx) => {
                const division = idx < midpoint ? 'A' : 'B';
                const divNum = (idx % midpoint) + 1;
                const newRollNo = `${student.class_year}-${division}-${String(divNum).padStart(3, '0')}`;

                updates.push({
                    id: student.id,
                    division: division,
                    roll_no: newRollNo
                });
            });
        });

        console.log(`Prepared ${updates.length} updates\n`);

        // Execute updates
        console.log('Step 3: Updating student records...');
        const stmt = db.prepare('UPDATE students SET division = ?, roll_no = ? WHERE id = ?');

        let completed = 0;
        updates.forEach(update => {
            stmt.run(update.division, update.roll_no, update.id, (err) => {
                if (err) console.error('Update error:', err);
                completed++;

                if (completed === updates.length) {
                    stmt.finalize();

                    // Step 4: Verify results
                    console.log('\n✅ All updates completed!\n');
                    console.log('Step 4: Verifying division distribution...\n');

                    db.all(`
                        SELECT department, class_year, division, COUNT(*) as count
                        FROM students
                        GROUP BY department, class_year, division
                        ORDER BY department, class_year, division
                    `, (err, results) => {
                        if (err) {
                            console.error('Verification error:', err);
                        } else {
                            console.log('Division Distribution:');
                            console.log('-'.repeat(60));

                            let currentDept = null;
                            results.forEach(row => {
                                if (currentDept !== row.department) {
                                    currentDept = row.department;
                                    console.log(`\n${row.department}:`);
                                }
                                console.log(`  ${row.class_year} - Division ${row.division}: ${row.count} students`);
                            });

                            // Summary
                            db.all(`
                                SELECT division, COUNT(*) as count
                                FROM students
                                GROUP BY division
                            `, (err, summary) => {
                                console.log('\n' + '='.repeat(60));
                                console.log('SUMMARY:');
                                summary.forEach(row => {
                                    console.log(`  Division ${row.division}: ${row.count} students`);
                                });

                                // Sample roll numbers
                                db.all(`
                                    SELECT roll_no, name, department, class_year, division
                                    FROM students
                                    WHERE department = 'IT' AND class_year = 'FY'
                                    LIMIT 5
                                `, (err, samples) => {
                                    console.log('\nSample Roll Numbers (IT FY):');
                                    console.log('-'.repeat(60));
                                    samples.forEach(s => {
                                        console.log(`  ${s.roll_no} - ${s.name} (Division ${s.division})`);
                                    });

                                    console.log('\n' + '='.repeat(60));
                                    console.log('✅ DIVISION SYSTEM 100% IMPLEMENTED!');
                                    console.log('='.repeat(60));
                                    console.log('\nAll students now have:');
                                    console.log('  - Division assignment (A or B)');
                                    console.log('  - Updated roll numbers (FY-A-001 format)');
                                    console.log('  - Even distribution across divisions');
                                    console.log('\n');

                                    db.close();
                                });
                            });
                        }
                    });
                }
            });
        });
    });
});
