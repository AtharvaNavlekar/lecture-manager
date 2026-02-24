const sqlite3 = require('sqlite3').verbose();
const path = require('path');
// Robust path resolution: resolve from THIS file's directory back to server/database.sqlite
const dbPath = path.resolve(__dirname, '../../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`Open DB: ${dbPath}`);

db.serialize(() => {
    console.log("Adding division column...");
    db.run("ALTER TABLE lectures ADD COLUMN division TEXT DEFAULT 'A'", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'division' already exists.");
            } else {
                console.error("Error adding column:", err);
            }
        } else {
            console.log("Column 'division' added successfully.");
        }
    });

    // Verify
    db.all("PRAGMA table_info(lectures)", (err, rows) => {
        if (err) console.error(err);
        else {
            const hasDivision = rows.some(r => r.name === 'division');
            console.log("Schema has division:", hasDivision);
        }
    });
});
