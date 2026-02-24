const { initDB, getDB } = require('./server/config/db');

initDB();
const db = getDB();

setTimeout(() => {
    console.log("Adding is_acting_hod column...");
    db.run("ALTER TABLE teachers ADD COLUMN is_acting_hod INTEGER DEFAULT 0", function (err) {
        if (err) {
            console.error("Error adding column (might already exist):", err.message);
        } else {
            console.log("✅ Column 'is_acting_hod' added successfully.");
        }
        process.exit();
    });
}, 1000);
