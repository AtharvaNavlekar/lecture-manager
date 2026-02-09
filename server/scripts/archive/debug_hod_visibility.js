const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('=== INVESTIGATING "HEAD OF IT" DATA VISIBILITY ===\n');

async function investigate() {
    const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    // 1. Check HOD's own record
    console.log('1. HOD Account Details:');
    const hod = await runQuery("SELECT id, email, name, department FROM teachers WHERE email = 'hod.it@college.edu'");
    console.log(hod[0]);
    const hodDept = hod[0].department;
    const hodId = hod[0].id;

    // 2. Check what teachers match this department
    console.log(`\n2. Teachers in department '${hodDept}':`);
    const teachers = await runQuery('SELECT id, name, email, department FROM teachers WHERE department = ?', [hodDept]);
    console.log(`   Found: ${teachers.length} teachers`);
    teachers.forEach(t => console.log(`   - ${t.name} (${t.email}) - Dept: ${t.department}`));

    // 3. Check students
    console.log(`\n3. Students in department '${hodDept}':`);
    const students = await runQuery('SELECT COUNT(*) as count FROM students WHERE department = ?', [hodDept]);
    console.log(`   Found: ${students[0].count} students`);

    // 4. Check lectures FOR THIS HOD (by teacher_id)
    console.log(`\n4. Lectures scheduled for HOD (id=${hodId}):`);
    const hodLectures = await runQuery('SELECT * FROM lectures WHERE scheduled_teacher_id = ? LIMIT 5', [hodId]);
    console.log(`   Found: ${hodLectures.length} lectures`);
    hodLectures.forEach(l => console.log(`   - ${l.subject} on ${l.date} ${l.start_time}-${l.end_time}`));

    // 5. Check lectures for ANY IT department teacher
    console.log(`\n5. Lectures for ANY teacher in IT department:`);
    const deptLectures = await runQuery(`
        SELECT COUNT(*) as count 
        FROM lectures l 
        JOIN teachers t ON l.scheduled_teacher_id = t.id 
        WHERE t.department = ?
    `, [hodDept]);
    console.log(`   Found: ${deptLectures[0].count} lectures`);

    // 6. Sample a few IT lectures
    const sampleLectures = await runQuery(`
        SELECT l.id, l.subject, l.date, l.class_year, t.name as teacher_name, t.department
        FROM lectures l 
        JOIN teachers t ON l.scheduled_teacher_id = t.id 
        WHERE t.department = ?
        LIMIT 5
    `, [hodDept]);
    console.log('\n   Sample lectures:');
    sampleLectures.forEach(l => console.log(`   - ${l.subject} (${l.class_year}) by ${l.teacher_name}`));

    db.close();
}

investigate().catch(err => {
    console.error('Error:', err);
    db.close();
});
