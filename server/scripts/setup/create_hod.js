const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('../database.sqlite');
db.configure('busyTimeout', 5000);

const createHOD = async () => {
    const passwordRaw = 'hod123';
    const email = 'hod@college.edu';
    const hash = await bcrypt.hash(passwordRaw, 10);

    db.serialize(() => {
        // Check if exists
        db.get("SELECT id FROM teachers WHERE email = ?", [email], (err, row) => {
            if (row) {
                // Update existing
                db.run(`
                    UPDATE teachers 
                    SET password = ?, is_hod = 1, department = 'CS', post = 'Head of Department', name = 'Head of Department'
                    WHERE email = ?
                `, [hash, email], (err) => {
                    if (err) console.error("Error updating HOD:", err);
                    else console.log("✅ Updated existing HOD user credentials to:", email, "/", passwordRaw);
                });
            } else {
                // Create new
                db.run(`
                    INSERT INTO teachers (name, email, password, department, post, is_hod, is_acting_hod) 
                    VALUES (?, ?, ?, ?, ?, 1, 0)
                `, ['Head of Department', email, hash, 'CS', 'Head of Department'], (err) => {
                    if (err) console.error("Error creating HOD:", err);
                    else console.log("✅ Created NEW HOD user:", email, "/", passwordRaw);
                });
            }
        });
    });

    setTimeout(() => {
        db.close();
    }, 1000);
};

createHOD();
