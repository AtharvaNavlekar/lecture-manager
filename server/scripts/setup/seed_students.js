/**
 * SEED SCRIPT: Generate 60 students per DIVISION per class per department
 * Run with: node server/scripts/setup/seed_students.js
 *
 * Each division (A, B, C …) gets exactly 60 students.
 * Uses INSERT OR IGNORE so re-running it is safe.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('DB Error:', err.message); process.exit(1); }
    console.log('✅ Connected to database');
});
db.configure('busyTimeout', 5000);

// ─── CONFIG ────────────────────────────────────────────────────────────────
const DEPARTMENTS = ['IT', 'CS', 'DS', 'AI', 'BMS', 'BAF', 'BAMMC'];
const CLASS_YEARS  = ['FY', 'SY', 'TY'];
const DIVISIONS    = ['A', 'B', 'C'];   // Each division = 60 students
const STUDENTS_PER_DIVISION = 60;

// Common Indian first and last names for realistic data
const FIRST_NAMES = [
    'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
    'Shaurya','Atharv','Advik','Dhruv','Kabir','Ritvik','Aadhya','Ananya','Diya','Pari',
    'Avni','Sara','Anvi','Priya','Saanvi','Kiran','Pooja','Neha','Rohit','Rahul',
    'Riya','Sneha','Riddhi','Shruti','Kavya','Tanya','Prachi','Divya','Komal','Swati',
    'Ankush','Nikhil','Rohan','Vikram','Arun','Sagar','Deepak','Amit','Varun','Gaurav',
    'Harsh','Jay','Kunal','Mihir','Neel','Omkar','Parth','Rajesh','Sachin','Tejas'
];

const LAST_NAMES = [
    'Sharma','Verma','Patel','Singh','Gupta','Kumar','Joshi','Mehta','Rao','Nair',
    'Iyer','Pandey','Mishra','Tiwari','Agarwal','Shah','Desai','Patil','Kale','More',
    'Kulkarni','Deshpande','Jain','Bhatia','Malhotra','Kapoor','Chopra','Reddy','Pillai','Nayak'
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function pick(arr, seed) {
    return arr[seed % arr.length];
}

function pad(n, len = 2) {
    return String(n).padStart(len, '0');
}

/**
 * Generate roll number: DEPT-YEAR-DIV-NN  e.g. IT-FY-A-01
 */
function rollNo(dept, classYear, division, idx) {
    return `${dept}-${classYear}-${division}-${pad(idx + 1)}`;
}

/**
 * Generate student email  e.g. aarav.sharma.itfya01@college.edu
 */
function email(firstName, lastName, dept, classYear, division, idx) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${dept.toLowerCase()}${classYear.toLowerCase()}${division.toLowerCase()}${pad(idx + 1)}@college.edu`;
}

// ─── SEED ────────────────────────────────────────────────────────────────────
const seed = () => {
    // First check how many students already exist
    db.get('SELECT COUNT(*) as count FROM students', [], (err, row) => {
        if (err) { console.error('Count error:', err); return; }

        if (row.count > 0) {
            console.log(`ℹ️  Students table already has ${row.count} records.`);
            console.log('   Using INSERT OR IGNORE – existing students will not be duplicated.\n');
        }

        const students = [];

        DEPARTMENTS.forEach(dept => {
            CLASS_YEARS.forEach(classYear => {
                DIVISIONS.forEach(division => {
                    for (let i = 0; i < STUDENTS_PER_DIVISION; i++) {
                        // Unique seed per dept+year+division+index so names vary
                        const nameSeed = DEPARTMENTS.indexOf(dept) * 10000
                                       + CLASS_YEARS.indexOf(classYear) * 1000
                                       + DIVISIONS.indexOf(division) * 100
                                       + i;

                        const firstName = pick(FIRST_NAMES, nameSeed);
                        const lastName  = pick(LAST_NAMES, nameSeed + 13); // offset for variety

                        students.push({
                            name:       `${firstName} ${lastName}`,
                            roll_no:    rollNo(dept, classYear, division, i),
                            email:      email(firstName, lastName, dept, classYear, division, i),
                            class_year: classYear,
                            department: dept,
                            division,
                            photo_url:  null
                        });
                    }
                });
            });
        });

        const total = STUDENTS_PER_DIVISION * DIVISIONS.length * CLASS_YEARS.length * DEPARTMENTS.length;
        console.log(`🎓 Seeding ${students.length} students`);
        console.log(`   ${STUDENTS_PER_DIVISION} per division × ${DIVISIONS.length} divisions × ${CLASS_YEARS.length} years × ${DEPARTMENTS.length} depts = ${total}\n`);

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const stmt = db.prepare(`
                INSERT OR IGNORE INTO students (name, roll_no, email, class_year, department, division, photo_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            students.forEach(s => {
                stmt.run(s.name, s.roll_no, s.email, s.class_year, s.department, s.division, s.photo_url);
            });

            stmt.finalize();

            db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                    console.error('❌ Commit failed:', commitErr);
                } else {
                    console.log('✅ Seed complete!');

                    // Print a summary grouped by dept + year + division
                    db.all(`
                        SELECT department, class_year, division, COUNT(*) as count
                        FROM students
                        GROUP BY department, class_year, division
                        ORDER BY department, class_year, division
                    `, [], (err, rows) => {
                        if (!err && rows.length > 0) {
                            console.log('\n📊 Student counts per division:\n');
                            console.log('Dept\tYear\tDiv\tCount');
                            console.log('────\t────\t───\t─────');
                            rows.forEach(r => console.log(`${r.department}\t${r.class_year}\t${r.division}\t${r.count}`));
                        }
                        db.close();
                    });
                }
            });
        });
    });
};

seed();
