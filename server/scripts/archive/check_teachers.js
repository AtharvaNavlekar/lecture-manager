const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, email FROM teachers", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Existing Teachers:", rows);
        console.log("Total Count:", rows.length);
    }
    db.close();
});
