const { db } = require('./config/db');

// Delete all existing lectures then re-check
db.run("DELETE FROM lectures", [], (err) => {
    if (err) {
        console.error('Error deleting lectures:', err);
        process.exit(1);
    }

    console.log('✅ Deleted all existing lectures from database');
    console.log('📋 Please re-upload the Master Schedule file to import with corrected dates');

    process.exit(0);
});
