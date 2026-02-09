/**
 * COMPREHENSIVE DATABASE CLEANUP SCRIPT
 * ========================================
 * Purpose: Remove duplicate HODs and prepare database for submission
 * 
 * Strategy:
 * 1. Keep NEWEST HODs (IDs 101-107) - from sample_data import (Jan 11, 2026)
 * 2. Remove or demote OLDER HODs (IDs 50, 58, 66, 74, 82, 90, 98, 99, 100)
 * 3. Verify only 1 HOD per department remains
 * 
 * Affected Departments:
 * - IT: Keep ID 105, Remove 66, 100
 * - CS: Keep ID 104, Remove 50, 98  
 * - DS: Keep ID 106, Remove 58, 99
 * - BAF: Keep ID 101, Remove 74
 * - BAMMC: Keep ID 102, Remove 82
 * - BMS: Keep ID 103, Remove 90
 */

const { db } = require('../config/db');

console.log('🔧 FACULTY DIRECTORY DATABASE CLEANUP');
console.log('=====================================\n');

// Step 1: Show current state
console.log('📊 BEFORE CLEANUP:');
db.all(`
    SELECT department, COUNT(*) as hod_count
    FROM teachers 
    WHERE is_hod = 1
    GROUP BY department
    ORDER BY department
`, (err, before) => {
    if (err) {
        console.error('❌ Error:', err);
        db.close();
        return;
    }

    console.log('Departments with HODs:');
    before.forEach(dept => {
        const status = dept.hod_count > 1 ? '❌ DUPLICATE' : '✅';
        console.log(`  ${status} ${dept.department}: ${dept.hod_count} HOD(s)`);
    });

    // Step 2: Execute cleanup
    console.log('\n🧹 EXECUTING CLEANUP...\n');

    // OPTION 1: Set is_hod = 0 (SAFER - preserves teacher data)
    // This keeps the teachers but removes their HOD status
    const oldHodIds = [50, 58, 66, 74, 82, 90, 98, 99, 100];

    db.run(`
        UPDATE teachers 
        SET is_hod = 0,
            post = CASE 
                WHEN post = 'Head of Department' THEN 'Professor'
                ELSE post
            END
        WHERE id IN (${oldHodIds.join(',')})
    `, function (err) {
        if (err) {
            console.error('❌ Cleanup failed:', err);
            db.close();
            return;
        }

        console.log(`✅ Removed HOD status from ${this.changes} old records`);
        console.log(`   IDs affected: ${oldHodIds.join(', ')}\n`);

        // Step 3: Verify cleanup
        console.log('📊 AFTER CLEANUP:');
        db.all(`
            SELECT department, COUNT(*) as hod_count,
                   GROUP_CONCAT(name || ' (ID: ' || id || ')') as hods
            FROM teachers 
            WHERE is_hod = 1
            GROUP BY department
            ORDER BY department
        `, (err, after) => {
            if (err) {
                console.error('❌ Verification error:', err);
                db.close();
                return;
            }

            let hasIssues = false;
            console.log('Departments with HODs:');
            after.forEach(dept => {
                const status = dept.hod_count > 1 ? '❌ STILL DUPLICATE!' : '✅';
                console.log(`  ${status} ${dept.department}: ${dept.hod_count} HOD(s)`);
                console.log(`       ${dept.hods}`);
                if (dept.hod_count > 1) hasIssues = true;
            });

            // Step 4: Count total teachers
            db.get('SELECT COUNT(*) as total FROM teachers', (err, count) => {
                if (err) {
                    console.error('Error counting teachers:', err);
                } else {
                    console.log(`\n👥 Total Teachers: ${count.total}`);
                }

                // Step 5: Show department distribution
                db.all(`
                    SELECT department, 
                           COUNT(*) as total_teachers,
                           SUM(CASE WHEN is_hod = 1 THEN 1 ELSE 0 END) as hods,
                           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
                    FROM teachers
                    GROUP BY department
                    ORDER BY department
                `, (err, stats) => {
                    if (err) {
                        console.error('Error fetching stats:', err);
                    } else {
                        console.log('\n📈 DEPARTMENT STATISTICS:');
                        console.log('┌─────────────────────────┬────────┬──────┬────────┐');
                        console.log('│ Department              │ Total  │ HODs │ Active │');
                        console.log('├─────────────────────────┼────────┼──────┼────────┤');
                        stats.forEach(s => {
                            const deptPad = s.department.padEnd(23);
                            const totalPad = String(s.total_teachers).padStart(6);
                            const hodPad = String(s.hods).padStart(4);
                            const activePad = String(s.active).padStart(6);
                            console.log(`│ ${deptPad} │ ${totalPad} │ ${hodPad} │ ${activePad} │`);
                        });
                        console.log('└─────────────────────────┴────────┴──────┴────────┘');
                    }

                    // Final result
                    console.log('\n' + '='.repeat(50));
                    if (hasIssues) {
                        console.log('⚠️  WARNING: Some departments still have duplicates!');
                        console.log('Please review the output above and run again if needed.');
                    } else {
                        console.log('✅ CLEANUP SUCCESSFUL!');
                        console.log('✅ Each department now has exactly 1 HOD');
                        console.log('✅ Database is ready for submission');
                    }
                    console.log('='.repeat(50) + '\n');

                    db.close();
                });
            });
        });
    });
});
