/**
 * Cleanup: wipe students and reseed 60 per division (A,B,C).
 * Run: node server/scripts/setup/fix_divisions.js
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, '../../database.sqlite'));
db.configure('busyTimeout', 10000);

const DEPARTMENTS = ['IT', 'CS', 'DS', 'AI', 'BMS', 'BAF', 'BAMMC'];
const CLASS_YEARS  = ['FY', 'SY', 'TY'];
const DIVISIONS    = ['A', 'B', 'C'];
const PER_DIVISION = 60;

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

function pick(arr, n) { return arr[Math.abs(n) % arr.length]; }
function pad(n) { return String(n).padStart(2, '0'); }

// Build all student rows up front
const rows = [];
DEPARTMENTS.forEach((dept, di) => {
    CLASS_YEARS.forEach((yr, yi) => {
        DIVISIONS.forEach((div, vi) => {
            for (let i = 0; i < PER_DIVISION; i++) {
                const seed = di * 10000 + yi * 1000 + vi * 100 + i;
                const fn = pick(FIRST_NAMES, seed);
                const ln = pick(LAST_NAMES, seed + 13);
                rows.push([
                    `${fn} ${ln}`,
                    `${dept}-${yr}-${div}-${pad(i+1)}`,
                    `${fn.toLowerCase()}.${ln.toLowerCase()}.${dept.toLowerCase()}${yr.toLowerCase()}${div.toLowerCase()}${pad(i+1)}@college.edu`,
                    yr, dept, div, null
                ]);
            }
        });
    });
});

console.log(`Generated ${rows.length} student rows in memory.`);
console.log('Connecting to DB and replacing students...\n');

// Step 1: delete all
db.run('DELETE FROM students', function(delErr) {
    if (delErr) { console.error('Delete error:', delErr); db.close(); return; }
    console.log(`Deleted all students. Rows removed: ${this.changes}`);

    // Step 2: insert all in one transaction using db.serialize
    let inserted = 0;
    let insertErr = null;

    db.run('BEGIN TRANSACTION', (txErr) => {
        if (txErr) { console.error('BEGIN error:', txErr); db.close(); return; }

        const stmt = db.prepare(
            'INSERT INTO students (name, roll_no, email, class_year, department, division, photo_url) VALUES (?,?,?,?,?,?,?)',
            (prepErr) => {
                if (prepErr) { console.error('Prepare error:', prepErr); db.close(); return; }

                rows.forEach(r => {
                    stmt.run(r, (runErr) => { if (runErr) { insertErr = runErr; } else { inserted++; } });
                });

                stmt.finalize((finalErr) => {
                    if (finalErr || insertErr) {
                        console.error('Insert error:', finalErr || insertErr);
                        db.run('ROLLBACK', () => db.close());
                        return;
                    }

                    db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                            console.error('COMMIT error:', commitErr);
                            db.run('ROLLBACK', () => db.close());
                            return;
                        }

                        console.log(`Inserted ${inserted} students successfully!\n`);
                        console.log(`= ${PER_DIVISION}/div x ${DIVISIONS.length} divs x ${CLASS_YEARS.length} yrs x ${DEPARTMENTS.length} depts\n`);

                        db.all(
                            `SELECT department, class_year, division, COUNT(*) as cnt
                             FROM students
                             GROUP BY department, class_year, division
                             ORDER BY department, class_year, division`,
                            [],
                            (qErr, qRows) => {
                                if (!qErr) {
                                    console.log('Dept\tYear\tDiv\tCount');
                                    console.log('----\t----\t---\t-----');
                                    qRows.forEach(r => console.log(`${r.department}\t${r.class_year}\t${r.division}\t${r.cnt}`));
                                }
                                db.close(() => console.log('\nDone. '));
                            }
                        );
                    });
                });
            }
        );
    });
});
