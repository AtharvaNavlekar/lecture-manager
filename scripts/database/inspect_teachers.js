const { initDB, getDB } = require('./server/config/db');

initDB();
const db = getDB();

setTimeout(() => {
    console.log("--- Teachers Table Schema ---");
    db.all("PRAGMA table_info(teachers)", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));

        console.log("\n--- Checking for Acting HODs ---");
        db.all("SELECT id, name, is_acting_hod FROM teachers WHERE is_acting_hod = 1", [], (err, rows) => {
            if (err) console.error(err);
            else console.log(JSON.stringify(rows, null, 2));
            process.exit();
        });
    });
}, 1000);
