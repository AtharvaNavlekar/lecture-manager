const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);
db.configure('busyTimeout', 5000);

const createDeptHODs = async () => {
    console.log("--- CREATING DEPARTMENT HODs ---");

    // 1. Get Unique Departments
    db.all("SELECT DISTINCT department FROM teachers WHERE department != 'Admin' AND department != 'Administration'", async (err, rows) => {
        if (err) { console.error(err); return; }

        const foundDepts = rows.map(r => r.department).filter(d => d);
        const standardDepts = ['CS', 'IT', 'DS', 'BMS', 'BAF', 'BAMMC', 'AI'];
        const depts = [...new Set([...foundDepts, ...standardDepts])];
        console.log("Found Departments (DB + Standard):", depts);

        for (const dept of depts) {
            const cleanDept = dept.replace(/\s+/g, '').toLowerCase();
            const email = `hod.${cleanDept}@college.edu`;
            const passwordRaw = `hod.${cleanDept}123`;
            const hash = await bcrypt.hash(passwordRaw, 10);

            // Check if this HOD email already exists
            await new Promise(resolve => {
                db.get("SELECT id FROM teachers WHERE email = ?", [email], (err, row) => {
                    if (row) {
                        // Update existing
                        db.run(`
                            UPDATE teachers 
                            SET password = ?, is_hod = 1, department = ?, post = 'Head of Department', name = ?
                            WHERE email = ?
                        `, [hash, dept, `Head of ${dept}`, email], (err) => {
                            if (!err) console.log(`✅ Updated HOD for ${dept}: ${email} / ${passwordRaw}`);
                            resolve();
                        });
                    } else {
                        // Create new
                        db.run(`
                            INSERT INTO teachers (name, email, password, department, post, is_hod, is_acting_hod) 
                            VALUES (?, ?, ?, ?, ?, 1, 0)
                        `, [`Head of ${dept}`, email, hash, dept, 'Head of Department'], (err) => {
                            if (!err) console.log(`✅ Created HOD for ${dept}: ${email} / ${passwordRaw}`);
                            resolve();
                        });
                    }
                });
            });
        }

        // Optional: Remove the generic 'hod@college.edu' to avoid confusion, or leave it as a fallback?
        // User said "all have hod's", best to cleanup the generic one if it doesn't belong to a specific valid dept logic 
        // or just leave it for safety. I'll leave it but maybe reassign it? 
        // Actually, let's just leave it for now unless user asks to delete.

        console.log("\n--- DONE ---");
        db.close();
    });
};

createDeptHODs();
