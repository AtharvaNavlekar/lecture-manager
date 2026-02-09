const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../server/database.sqlite');

db.all("PRAGMA table_info(leave_requests)", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Schema for leave_requests:");
        rows.forEach(r => console.log(`${r.cid} | ${r.name} | ${r.type}`));
    }
    db.close();
});
