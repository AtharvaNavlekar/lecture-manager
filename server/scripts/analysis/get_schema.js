const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📋 Extracting Database Schema...\n');

db.all(`
    SELECT name, sql 
    FROM sqlite_master 
    WHERE type='table' 
    AND sql IS NOT NULL
    ORDER BY name
`, (err, tables) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log(`Found ${tables.length} tables:\n`);

    let output = '# Database Schema\n\n';

    tables.forEach((table) => {
        console.log(`✓ ${table.name}`);
        output += `## ${table.name}\n\`\`\`sql\n${table.sql}\n\`\`\`\n\n`;
    });

    fs.writeFileSync('schema_export.txt', output);
    console.log('\n✅ Schema exported to schema_export.txt');

    db.close();
});
