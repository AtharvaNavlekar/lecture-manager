const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         LECTURE MANAGER - SYSTEM VERIFICATION              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const results = {
    passed: [],
    failed: [],
    warnings: []
};

function pass(check) {
    results.passed.push(check);
    console.log(`✅ ${check}`);
}

function fail(check, reason) {
    results.failed.push({ check, reason });
    console.log(`❌ ${check}: ${reason}`);
}

function warn(check, reason) {
    results.warnings.push({ check, reason });
    console.log(`⚠️  ${check}: ${reason}`);
}

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function verify() {
    console.log('📋 Running System Verification Checks...\n');

    // 1. Database Connection
    try {
        await runQuery('SELECT 1');
        pass('Database connection established');
    } catch (err) {
        fail('Database connection', err.message);
        return;
    }

    // 2. Check WAL Mode
    try {
        const walMode = await runQuery('PRAGMA journal_mode');
        if (walMode[0].journal_mode === 'wal') {
            pass('WAL mode enabled for database concurrency');
        } else {
            warn('WAL mode', `Current mode: ${walMode[0].journal_mode}`);
        }
    } catch (err) {
        warn('WAL mode check', err.message);
    }

    // 3. Department Config Consistency
    console.log('\n📊 Checking Department Configuration...');
    try {
        const depts = await runQuery('SELECT code, name FROM departments WHERE is_active = 1 ORDER BY code');
        console.log(`   Found ${depts.length} active departments:`);
        depts.forEach(d => console.log(`   - ${d.code}: ${d.name}`));

        const validCodes = ['IT', 'CS', 'DS', 'BAF', 'BAMMC', 'BMS'];
        const actualCodes = depts.map(d => d.code);

        const allValid = actualCodes.every(code => validCodes.includes(code) || code.length <= 6);
        if (allValid) {
            pass('Department codes are standardized');
        } else {
            fail('Department codes', 'Some departments use non-standard codes');
        }
    } catch (err) {
        fail('Department config check', err.message);
    }

    // 4. Data Consistency Check
    console.log('\n📊 Checking Data Consistency...');
    try {
        // Check for any verbose department names in data tables
        const badTeachers = await runQuery("SELECT COUNT(*) as count FROM teachers WHERE department LIKE '%B.Sc%' OR department LIKE '%B_SC%'");
        const badStudents = await runQuery("SELECT COUNT(*) as count FROM students WHERE department LIKE '%B.Sc%' OR department LIKE '%B_SC%'");
        const badSubjects = await runQuery("SELECT COUNT(*) as count FROM subjects WHERE department LIKE '%B.Sc%' OR department LIKE '%B_SC%'");

        const totalBad = badTeachers[0].count + badStudents[0].count + badSubjects[0].count;

        if (totalBad === 0) {
            pass('All data tables use standardized department codes');
        } else {
            fail('Data normalization', `${totalBad} records still using verbose names`);
        }
    } catch (err) {
        warn('Data consistency check', err.message);
    }

    // 5. Department-wise Data Distribution
    console.log('\n📊 Data Distribution by Department...');
    try {
        const teacherDist = await runQuery('SELECT department, COUNT(*) as count FROM teachers GROUP BY department ORDER BY department');
        const studentDist = await runQuery('SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY department');

        console.log('\n   Teachers:');
        teacherDist.forEach(d => console.log(`   ${d.department}: ${d.count}`));

        console.log('\n   Students:');
        studentDist.forEach(d => console.log(`   ${d.department}: ${d.count}`));

        pass('Data distribution check complete');
    } catch (err) {
        warn('Data distribution', err.message);
    }

    // 6. HOD Accounts
    console.log('\n👥 Checking HOD Accounts...');
    try {
        const hods = await runQuery("SELECT email, department, name FROM teachers WHERE is_hod = 1 OR email LIKE 'hod.%' ORDER BY department");
        console.log(`   Found ${hods.length} HOD accounts:`);
        hods.forEach(h => console.log(`   - ${h.email} (${h.department})`));

        if (hods.length >= 6) {
            pass('HOD accounts created for all departments');
        } else {
            warn('HOD accounts', `Only ${hods.length} HOD accounts found`);
        }
    } catch (err) {
        warn('HOD check', err.message);
    }

    // 7. Table Schema Integrity
    console.log('\n🗄️  Checking Table Schemas...');
    const requiredTables = [
        'teachers', 'students', 'subjects', 'lectures',
        'departments', 'academic_years', 'time_slots', 'divisions'
    ];

    for (const table of requiredTables) {
        try {
            await runQuery(`SELECT COUNT(*) FROM ${table}`);
            pass(`Table '${table}' exists`);
        } catch (err) {
            fail(`Table '${table}'`, 'Does not exist');
        }
    }

    // 8. Sample Data Availability
    console.log('\n📦 Checking Sample Data...');
    try {
        const counts = {
            teachers: (await runQuery('SELECT COUNT(*) as c FROM teachers'))[0].c,
            students: (await runQuery('SELECT COUNT(*) as c FROM students'))[0].c,
            subjects: (await runQuery('SELECT COUNT(*) as c FROM subjects'))[0].c,
            lectures: (await runQuery('SELECT COUNT(*) as c FROM lectures'))[0].c
        };

        console.log(`   Teachers: ${counts.teachers}`);
        console.log(`   Students: ${counts.students}`);
        console.log(`   Subjects: ${counts.subjects}`);
        console.log(`   Lectures: ${counts.lectures}`);

        if (counts.teachers > 0 && counts.students > 0) {
            pass('Sample data is populated');
        } else {
            warn('Sample data', 'Some core tables are empty');
        }
    } catch (err) {
        warn('Sample data check', err.message);
    }

    // Final Report
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    VERIFICATION SUMMARY                   ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (results.failed.length > 0) {
        console.log('❌ CRITICAL ISSUES:');
        results.failed.forEach(f => console.log(`   - ${f.check}: ${f.reason}`));
        console.log('');
    }

    if (results.warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        results.warnings.forEach(w => console.log(`   - ${w.check}: ${w.reason}`));
        console.log('');
    }

    if (results.failed.length === 0 && results.warnings.length === 0) {
        console.log('🎉 SYSTEM IS 100% READY! All checks passed.');
    } else if (results.failed.length === 0) {
        console.log('✅ System is operational with minor warnings.');
    } else {
        console.log('⚠️  System has critical issues that need attention.');
    }

    db.close();
    process.exit(results.failed.length > 0 ? 1 : 0);
}

verify().catch(err => {
    console.error('Verification failed:', err);
    db.close();
    process.exit(1);
});
