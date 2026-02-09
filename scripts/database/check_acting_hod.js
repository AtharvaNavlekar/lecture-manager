const { initDB, getDB } = require('./server/config/db');

initDB();
const db = getDB();

setTimeout(() => {
    console.log("--- Checking Acting HODs ---");
    db.all("SELECT id, name, email, department, is_acting_hod, is_hod FROM teachers WHERE is_acting_hod = 1 OR is_hod = 1", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
        process.exit();
    });
}, 1000);
