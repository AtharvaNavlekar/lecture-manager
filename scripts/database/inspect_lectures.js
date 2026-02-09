const { initDB, getDB } = require('./server/config/db');

initDB();
const db = getDB();

setTimeout(() => {
    console.log("--- Schema ---");
    db.all("PRAGMA table_info(lectures)", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows));

        console.log("\n--- Data Sample ---");
        db.all("SELECT * FROM lectures LIMIT 3", [], (err, rows) => {
            if (err) console.error(err);
            else console.log(JSON.stringify(rows, null, 2));
            process.exit();
        });
    });
}, 1000);
