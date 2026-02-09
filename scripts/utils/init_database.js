const { initDB } = require('./server/config/db');

console.log('Manually initializing database...\n');

initDB();

console.log('\n✅ Database initialization triggered!');
console.log('Check the output above for table creation confirmations.');

// Give it some time to complete
setTimeout(() => {
    console.log('\nDone! The database should now have all tables.');
    process.exit(0);
}, 3000);
