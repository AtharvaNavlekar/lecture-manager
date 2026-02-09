/**
 * ROOT CAUSE ANALYSIS: Department Metrics Duplicates
 * 
 * The React console shows duplicate keys for: DS, CS, IT
 * Even after changing key={dept.code}, duplicates persist
 * 
 * This means the departments ARRAY has duplicate entries
 */

const { db } = require('./config/db');

console.log('🔍 COMPREHENSIVE DEPARTMENT ANALYSIS\n');
console.log('='.repeat(60));

// Step 1: Check config departments
db.all("SELECT * FROM config WHERE key = 'departments'", [], (err, config) => {
    if (err) {
        console.error('Config error:', err);
        process.exit(1);
    }

    console.log('\n📋 STEP 1: Config Departments');
    console.log('='.repeat(60));
    if (config && config.length > 0) {
        const depts = JSON.parse(config[0].value);
        console.log(`Found ${depts.length} departments in config:`);
        depts.forEach(d => {
            console.log(`  - ${d.code}: ${d.name}`);
        });
    } else {
        console.log('  ⚠️  No departments in config!');
    }

    // Step 2: Check teacher departments
    db.all(`
        SELECT DISTINCT department, COUNT(*) as count
        FROM teachers
        GROUP BY department
        ORDER BY department
    `, [], (err2, teacherDepts) => {
        console.log('\n👥 STEP 2: Teacher Departments (what teachers.department contains)');
        console.log('='.repeat(60));
        teacherDepts.forEach(d => {
            console.log(`  ${d.department}: ${d.count} teachers`);
        });

        // Step 3: Simulate frontend logic
        console.log('\n🔄 STEP 3: Simulating Frontend Department Map Logic');
        console.log('='.repeat(60));

        db.all("SELECT * FROM teachers", [], (err3, allTeachers) => {
            db.all("SELECT * FROM config WHERE key = 'departments'", [], (err4, cfg) => {
                const configDepts = cfg && cfg.length > 0 ? JSON.parse(cfg[0].value) : [];

                console.log('\nInitializing deptMap from config:');
                const deptMap = {};
                configDepts.forEach(d => {
                    deptMap[d.code] = {
                        name: d.name,
                        code: d.code,
                        faculty: 0
                    };
                    console.log(`  Created entry: key="${d.code}", name="${d.name}"`);
                });

                console.log('\nProcessing teachers:');
                allTeachers.forEach(teacher => {
                    const configDept = configDepts.find(d =>
                        d.name === teacher.department || d.code === teacher.department
                    );
                    const deptKey = configDept ? configDept.code : teacher.department;

                    if (!deptMap[deptKey]) {
                        console.log(`  ⚠️  Creating NEW entry for key="${deptKey}" (teacher.dept="${teacher.department}")`);
                        deptMap[deptKey] = {
                            name: configDept ? configDept.name : teacher.department,
                            code: deptKey,
                            faculty: 0
                        };
                    }
                    deptMap[deptKey].faculty++;
                });

                const finalDepts = Object.values(deptMap);
                console.log('\n📊 FINAL RESULT:');
                console.log('='.repeat(60));
                console.log(`Total departments in array: ${finalDepts.length}`);
                finalDepts.forEach(d => {
                    console.log(`  - code="${d.code}", name="${d.name}", faculty=${d.faculty}`);
                });

                // Check for duplicates
                const codes = finalDepts.map(d => d.code);
                const uniqueCodes = [...new Set(codes)];
                if (codes.length !== uniqueCodes.length) {
                    console.log('\n❌ DUPLICATES FOUND!');
                    const duplicates = codes.filter((c, i) => codes.indexOf(c) !== i);
                    console.log('Duplicate codes:', [...new Set(duplicates)]);
                } else {
                    console.log('\n✅ No duplicates in final array');
                }

                process.exit(0);
            });
        });
    });
});
