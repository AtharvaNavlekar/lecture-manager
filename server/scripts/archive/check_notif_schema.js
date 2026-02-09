const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking notifications table schema...');
db.all("PRAGMA table_info(notifications)", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Columns in notifications table:");
    rows.forEach(row => console.log(`- ${row.name} (${row.type})`));
});
