const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const query = `
    SELECT 
        name, 
        email, 
        department, 
        role, 
        is_hod,
        'teacher123' as password_hint -- Assuming default password for generated data
    FROM teachers 
    ORDER BY department, role DESC, name
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('Error executing query:', err);
        process.exit(1);
    }

    // Group by department
    const grouped = rows.reduce((acc, user) => {
        const dept = user.department || 'Unassigned';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(user);
        return acc;
    }, {});

    console.log(JSON.stringify(grouped, null, 2));
    db.close();
});
