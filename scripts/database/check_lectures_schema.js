const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../server/database.sqlite');

db.serialize(() => {
    db.all("PRAGMA table_info(lectures)", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });
});
