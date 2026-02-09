const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../lecture_manager.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding missing columns to substitute system...\n');

// Add submitted_at to leave_requests if missing
db.run(`
    ALTER TABLE leave_requests 
    ADD COLUMN submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding submitted_at:', err.message);
    } else {
        console.log('✅ submitted_at column ensured');
    }
});

// Add hod_decision_at to leave_requests if missing  
db.run(`
    ALTER TABLE leave_requests 
    ADD COLUMN hod_decision_at DATETIME
`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding hod_decision_at:', err.message);
    } else {
        console.log('✅ hod_decision_at column ensured');
    }
});

// Add response_deadline to substitute_assignments if missing
db.run(`
    ALTER TABLE substitute_assignments 
    ADD COLUMN response_deadline DATETIME
`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding response_deadline:', err.message);
    } else {
        console.log('✅ response_deadline column ensured');
    }

    db.close(() => {
        console.log('\n✅ Database schema updated!');
        console.log('You can now start the server with: npm start');
    });
});
