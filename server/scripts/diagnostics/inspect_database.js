const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

console.log('🔍 DATABASE SCHEMA INSPECTOR');
console.log('============================\n');
console.log('Database:', dbPath, '\n');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Failed to connect:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database\n');
});

// Get schema info for lectures table
db.all("PRAGMA table_info(lectures)", [], (err, columns) => {
    if (err) {
        console.error('❌ Error getting table info:', err.message);
        db.close();
        process.exit(1);
    }

    console.log('📋 LECTURES TABLE SCHEMA');
    console.log('========================\n');
    console.log('Column Name          Type       NOT NULL   Default    Primary Key');
    console.log('─────────────────────────────────────────────────────────────────');

    let issues = [];

    columns.forEach(col => {
        const name = col.name.padEnd(20);
        const type = (col.type || 'NULL').padEnd(10);
        const notNull = col.notnull ? 'YES' : 'NO';
        const notNullPad = notNull.padEnd(10);
        const defVal = (col.dflt_value || '').padEnd(10);
        const pk = col.pk ? 'YES' : 'NO';

        console.log(`${name} ${type} ${notNullPad} ${defVal} ${pk}`);

        // Check for problematic NOT NULL constraints
        if ((col.name === 'start_time' || col.name === 'end_time') && col.notnull === 1) {
            issues.push({
                column: col.name,
                issue: 'Has NOT NULL constraint but should be optional',
                severity: 'CRITICAL'
            });
        }
    });

    console.log('\n');

    // Get sample data
    db.get('SELECT COUNT(*) as count FROM lectures', [], (err, row) => {
        if (!err) {
            console.log(`📊 Total lectures in database: ${row.count}\n`);
        }

        // Check for lectures with NULL time values
        db.get(`
            SELECT COUNT(*) as count 
            FROM lectures 
            WHERE start_time IS NULL OR end_time IS NULL
        `, [], (err, row) => {
            if (!err && row.count > 0) {
                console.log(`⚠️  Found ${row.count} lectures with NULL time values\n`);
            }
        });

        // Report issues
        if (issues.length > 0) {
            console.log('🚨 ISSUES FOUND');
            console.log('===============\n');
            issues.forEach((issue, idx) => {
                console.log(`${idx + 1}. Column: ${issue.column}`);
                console.log(`   Issue: ${issue.issue}`);
                console.log(`   Severity: ${issue.severity}\n`);
            });

            console.log('💡 RECOMMENDATION');
            console.log('=================\n');
            console.log('Run the migration script to fix these constraints:');
            console.log('  node scripts/migrations/fix_lectures_schema.js\n');
        } else {
            console.log('✅ No schema issues detected\n');
        }

        // Get detailed SQL schema
        db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='lectures'", [], (err, row) => {
            if (!err && row) {
                console.log('📝 ACTUAL CREATE TABLE SQL');
                console.log('==========================\n');
                console.log(row.sql);
                console.log('\n');
            }

            db.close(() => {
                if (issues.length > 0) {
                    process.exit(1);
                } else {
                    process.exit(0);
                }
            });
        });
    });
});
