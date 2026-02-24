const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../server/database.sqlite');

db.serialize(() => {
    console.log("Checking 'users' table for HODs...");
    db.all("SELECT * FROM users WHERE email LIKE '%hod%'", (err, rows) => {
        if (err) {
            console.log("Error checking users table (might not exist):", err.message);
        } else {
            console.log("Found in users table:", JSON.stringify(rows, null, 2));
        }

        console.log("Checking 'teachers' table for HODs...");
        db.all("SELECT * FROM teachers WHERE email LIKE '%hod%'", (err, rows) => {
            if (err) {
                console.log("Error checking teachers table:", err.message);
            } else {
                console.log("Found in teachers table:", JSON.stringify(rows, null, 2));
            }
        });
    });
});
