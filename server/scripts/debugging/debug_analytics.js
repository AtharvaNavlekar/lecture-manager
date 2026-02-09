const { db } = require('./config/db');

console.log('🔍 Debugging Analytics Endpoint\n');

// First, check the admin user
db.get("SELECT id, name, email, department, role FROM teachers WHERE role = 'admin'", [], (err, admin) => {
    if (err || !admin) {
        console.log('❌ No admin user found!');
        console.log('   Creating test user for authentication...');
        process.exit(1);
    }

    console.log('👤 Admin User:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Department: "${admin.department}"`);
    console.log(`   Role: ${admin.role}`);
    console.log('');

    // Now simulate the analytics query
    const teacherId = admin.id;
    const userRole = 'admin'; // This should come from req.userRole

    db.get("SELECT department, is_hod FROM teachers WHERE id = ?", [teacherId], (err2, me) => {
        if (err2 || !me) {
            console.log('❌ Teacher lookup failed');
            process.exit(1);
        }

        const dept = me.department;
        console.log('📊 Simulating Analytics Query:');
        console.log(`   User Role: ${userRole}`);
        console.log(`   Department: "${dept}"`);
        console.log('');

        // Check the WHERE clause logic
        const whereClause = userRole === 'admin' ? '' : 'WHERE department = ?';
        const params = userRole === 'admin' ? [] : [dept];

        console.log(`   SQL: SELECT id FROM teachers ${whereClause}`);
        console.log(`   Params: [${params}]`);
        console.log('');

        db.all(`SELECT id FROM teachers ${whereClause}`, params, (err3, teachers) => {
            if (err3) {
                console.log('❌ Query failed:', err3);
                process.exit(1);
            }

            console.log(`✅ Found ${teachers.length} teachers`);

            const teacherIds = teachers.map(t => t.id);
            const placeholders = teacherIds.map(() => '?').join(',');

            db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM lectures 
                WHERE scheduled_teacher_id IN (${placeholders})
            `, teacherIds, (err4, stats) => {
                if (err4) {
                    console.log('❌ Lecture stats query failed:', err4);
                    process.exit(1);
                }

                console.log('\n📊 Result:');
                console.log(`   Total Lectures: ${stats.total}`);
                console.log(`   Completed: ${stats.completed}`);

                if (stats.total === 0) {
                    console.log('\n⚠️  PROBLEM: Query returns 0 lectures!');
                    console.log('   Checking if lectures exist...');

                    db.get("SELECT COUNT(*) as count FROM lectures", [], (err5, lectureCount) => {
                        console.log(`   Total lectures in DB: ${lectureCount.count}`);
                        if (lectureCount.count > 0) {
                            console.log('   ❌ Lectures exist but query doesn\'t find them!');
                            console.log('   Issue: Teacher IDs don\'t match lecture scheduled_teacher_id');
                        }
                        process.exit(0);
                    });
                } else {
                    console.log('\n✅ Query works correctly!');
                    process.exit(0);
                }
            });
        });
    });
});
