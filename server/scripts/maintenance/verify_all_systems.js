const { db } = require('../config/db');

console.log('🔍 COMPREHENSIVE SYSTEM VERIFICATION');
console.log('====================================\n');

let totalChecks = 0;
let passedChecks = 0;
const issues = [];

function check(category, description, passed, details = '') {
    totalChecks++;
    const status = passed ? '✅' : '❌';
    console.log(`${status} [${category}] ${description}`);
    if (details) console.log(`   ${details}`);
    if (passed) {
        passedChecks++;
    } else {
        issues.push({ category, description, details });
    }
}

// 1. DATABASE TABLES CHECK
console.log('📊 DATABASE STRUCTURE');
console.log('---------------------');
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    const tableNames = tables.map(t => t.name);
    const requiredTables = ['teachers', 'lectures', 'students', 'subjects', 'attendance_records', 'notifications', 'announcements'];

    requiredTables.forEach(table => {
        check('Database', `Table '${table}' exists`, tableNames.includes(table));
    });
    console.log('');

    // 2. TEACHER DATA
    console.log('👥 FACULTY MANAGEMENT');
    console.log('---------------------');
    db.get('SELECT COUNT(*) as count FROM teachers', (err, result) => {
        check('Faculty', 'Teachers exist in database', result.count > 0, `${result.count} teachers found`);

        db.all('SELECT department, COUNT(*) as count FROM teachers WHERE is_hod=1 GROUP BY department', (err, hods) => {
            const hasDuplicates = hods.some(h => h.count > 1);
            check('Faculty', 'No duplicate HODs', !hasDuplicates, `${hods.length} departments with HODs`);
            console.log('');

            // 3. STUDENT DATA
            console.log('🎓 STUDENT MANAGEMENT');
            console.log('---------------------');
            db.get('SELECT COUNT(*) as count FROM students', (err, result) => {
                check('Students', 'Students exist in database', result.count > 0, `${result.count} students found`);

                db.all('SELECT class_year, COUNT(*) as count FROM students GROUP BY class_year', (err, years) => {
                    check('Students', 'Students distributed across years', years && years.length > 0, `${years ? years.length : 0} class years`);
                    console.log('');

                    // 4. SUBJECT DATA
                    console.log('📚 SUBJECT MANAGEMENT');
                    console.log('---------------------');
                    db.get('SELECT COUNT(*) as count FROM subjects', (err, result) => {
                        check('Subjects', 'Subjects exist in database', result && result.count > 0, `${result ? result.count : 0} subjects found`);

                        db.all('SELECT department, COUNT(*) as count FROM subjects GROUP BY department', (err, depts) => {
                            check('Subjects', 'Subjects assigned to departments', depts && depts.length > 0, `${depts ? depts.length : 0} departments`);
                            console.log('');

                            // 5. LECTURE/SCHEDULE DATA
                            console.log('📅 MASTER SCHEDULE');
                            console.log('------------------');
                            db.get('SELECT COUNT(*) as count FROM lectures', (err, result) => {
                                check('Schedule', 'Lectures scheduled', result && result.count > 0, `${result ? result.count : 0} lectures`);

                                db.get('SELECT COUNT(DISTINCT scheduled_teacher_id) as teachers FROM lectures WHERE scheduled_teacher_id IS NOT NULL', (err, result) => {
                                    check('Schedule', 'Teachers assigned to lectures', result && result.teachers > 0, `${result ? result.teachers : 0} teachers with schedules`);

                                    db.get('SELECT COUNT(*) as count FROM lectures WHERE date IS NOT NULL', (err, result) => {
                                        check('Schedule', 'Lectures have dates', result && result.count > 0, `${result ? result.count : 0} dated lectures`);
                                        console.log('');

                                        // 6. ATTENDANCE DATA
                                        console.log('📋 ATTENDANCE SYSTEM');
                                        console.log('--------------------');
                                        db.get('SELECT COUNT(*) as count FROM attendance_records', (err, result) => {
                                            const hasAttendance = result && result.count > 0;
                                            check('Attendance', 'Attendance records exist', hasAttendance, `${result ? result.count : 0} records`);
                                            console.log('');

                                            // 7. NOTIFICATIONS
                                            console.log('🔔 NOTIFICATIONS');
                                            console.log('----------------');
                                            db.get('SELECT COUNT(*) as count FROM notifications', (err, result) => {
                                                const hasNotif = result && result.count > 0;
                                                check('Notifications', 'Notification system initialized', hasNotif, `${result ? result.count : 0} notifications`);
                                                console.log('');

                                                // 8. ANNOUNCEMENTS
                                                console.log('📢 ANNOUNCEMENTS');
                                                console.log('----------------');
                                                db.get('SELECT COUNT(*) as count FROM announcements', (err, result) => {
                                                    const hasAnnounce = result && result.count > 0;
                                                    check('Announcements', 'Announcement system initialized', hasAnnounce, `${result ? result.count : 0} announcements`);
                                                    console.log('');

                                                    // FINAL SUMMARY
                                                    console.log('='.repeat(50));
                                                    console.log(`\n📊 SUMMARY: ${passedChecks}/${totalChecks} checks passed (${Math.round(passedChecks / totalChecks * 100)}%)\n`);

                                                    if (issues.length > 0) {
                                                        console.log('⚠️  ISSUES FOUND:');
                                                        issues.forEach((issue, idx) => {
                                                            console.log(`\n${idx + 1}. [${issue.category}] ${issue.description}`);
                                                            if (issue.details) console.log(`   ${issue.details}`);
                                                        });
                                                    }

                                                    console.log('\n' + '='.repeat(50));

                                                    if (passedChecks === totalChecks) {
                                                        console.log('🎉 ALL SYSTEMS OPERATIONAL!');
                                                        console.log('✅ Ready for submission');
                                                    } else if (passedChecks >= totalChecks * 0.8) {
                                                        console.log('⚠️  MOSTLY WORKING');
                                                        console.log('Some features need attention but core functionality intact');
                                                    } else {
                                                        console.log('❌ CRITICAL ISSUES FOUND');
                                                        console.log('Multiple systems need fixing before submission');
                                                    }

                                                    console.log('='.repeat(50) + '\n');

                                                    db.close();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
