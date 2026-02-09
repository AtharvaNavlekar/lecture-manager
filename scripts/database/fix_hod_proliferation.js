const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/database.sqlite');

db.serialize(() => {
    // 1. Reset ALL HOD flags to 0
    db.run("UPDATE teachers SET is_hod = 0", (err) => {
        if (err) return console.error("Error resetting HODs:", err);
        console.log("Reset all HOD flags.");

        // 2. Reinstate Official HODs (IDs 102, 103, 104, 105)
        const officialEmails = ['hod.ai@college.edu', 'hod.cs@college.edu', 'hod.it@college.edu', 'hod.ds@college.edu'];
        const placeholders = officialEmails.map(() => '?').join(',');

        db.run(`UPDATE teachers SET is_hod = 1 WHERE email IN (${placeholders})`, officialEmails, function (err) {
            if (err) return console.error("Error restoring official HODs:", err);
            console.log(`Restored ${this.changes} official HODs.`);
        });

        // 3. Fix Teacher 4 Specifiically
        // User says Teacher 4 became "DS HOD" but should be IT.
        // We will make them a regular IT teacher.
        db.run("UPDATE teachers SET department = 'IT', is_hod = 0 WHERE email = 'teacher4@college.edu'", function (err) {
            if (err) return console.error("Error fixing Teacher 4:", err);
            console.log(`Fixed Teacher 4: Department set to IT, is_hod = 0.`);
        });
    });
});
