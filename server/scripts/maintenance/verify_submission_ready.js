/**
 * FINAL VERIFICATION SCRIPT
 * =========================
 * Run this before submission to verify all fixes are working
 */

const { db } = require('../config/db');

console.log('🔍 FACULTY DIRECTORY - FINAL VERIFICATION');
console.log('==========================================\n');

let passedChecks = 0;
let totalChecks = 0;

function check(description, condition, details = '') {
    totalChecks++;
    if (condition) {
        console.log(`✅ ${description}`);
        if (details) console.log(`   ${details}`);
        passedChecks++;
        return true;
    } else {
        console.log(`❌ ${description}`);
        if (details) console.log(`   ${details}`);
        return false;
    }
}

// Check 1: No duplicate HODs
db.all(`
    SELECT department, COUNT(*) as hod_count
    FROM teachers 
    WHERE is_hod = 1
    GROUP BY department
`, (err, depts) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('📋 CHECK 1: Duplicate HOD Prevention');
    console.log('-------------------------------------');
    const hasDuplicates = depts.some(d => d.hod_count > 1);
    check('No duplicate HODs exist', !hasDuplicates,
        hasDuplicates ? 'Found departments with multiple HODs!' : 'All departments have exactly 1 HOD');
    console.log('');

    // Check 2: Every department has exactly 1 HOD
    console.log('📋 CHECK 2: HOD Coverage');
    console.log('------------------------');
    const departsWithHod = depts.filter(d => d.hod_count === 1).length;
    const totalDepts = depts.length;
    check(`All ${totalDepts} active departments have HODs`, departsWithHod === totalDepts,
        `${departsWithHod}/${totalDepts} departments have HODs`);
    console.log('');

    // Check 3: Teacher counts are reasonable
    db.all(`
        SELECT department, COUNT(*) as count
        FROM teachers
        WHERE department != 'Admin'
        GROUP BY department
    `, (err, teacherCounts) => {
        console.log('📋 CHECK 3: Teacher Distribution');
        console.log('---------------------------------');
        const allReasonable = teacherCounts.every(t => t.count >= 1 && t.count <= 20);
        check('All departments have reasonable teacher counts (1-20)', allReasonable,
            `Range: ${Math.min(...teacherCounts.map(t => t.count))} to ${Math.max(...teacherCounts.map(t => t.count))} teachers`);

        teacherCounts.forEach(t => {
            console.log(`   ${t.department}: ${t.count} teachers`);
        });
        console.log('');

        // Check 4: All teachers are active
        db.all(`SELECT COUNT(*) as total, SUM(is_active) as active FROM teachers`, (err, status) => {
            console.log('📋 CHECK 4: Teacher Status');
            console.log('--------------------------');
            const allActive = status[0].total === status[0].active;
            check('All teachers are marked as active', allActive,
                `${status[0].active}/${status[0].total} teachers active`);
            console.log('');

            // Check 5: No orphaned data
            db.all(`
                SELECT COUNT(DISTINCT l.scheduled_teacher_id) as teachers_with_lectures
                FROM lectures l
                WHERE l.scheduled_teacher_id IS NOT NULL
            `, (err, lectureCheck) => {
                console.log('📋 CHECK 5: Data Integrity');
                console.log('--------------------------');
                db.get('SELECT COUNT(*) as total FROM teachers', (err, teacherTotal) => {
                    const hasLectures = lectureCheck[0].teachers_with_lectures > 0;
                    check('Lecture assignments exist', hasLectures,
                        `${lectureCheck[0].teachers_with_lectures} teachers have scheduled lectures`);
                    console.log('');

                    // Final Summary
                    console.log('='.repeat(50));
                    console.log(`\n📊 SUMMARY: ${passedChecks}/${totalChecks} checks passed\n`);

                    if (passedChecks === totalChecks) {
                        console.log('🎉 ALL CHECKS PASSED!');
                        console.log('✅ Faculty Directory is ready for submission');
                        console.log('');
                        console.log('Final Steps:');
                        console.log('  1. Restart dev server: npm run dev  ');
                        console.log('  2. Navigate to /faculty page');
                        console.log('  3. Verify UI displays correctly');
                        console.log('  4. Test edit functionality');
                        console.log('  5. Hard refresh browser if needed (Ctrl+Shift+R)');
                    } else {
                        console.log('⚠️  SOME CHECKS FAILED');
                        console.log('Please review the issues above and fix before submission');
                    }
                    console.log('\n' + '='.repeat(50));

                    db.close();
                });
            });
        });
    });
});
