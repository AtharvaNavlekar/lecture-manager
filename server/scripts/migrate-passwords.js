/**
 * migrate-passwords.js
 * 
 * One-time migration script to hash all plaintext passwords in the database.
 * Run with: node server/scripts/migrate-passwords.js
 * 
 * After running, verify all passwords start with '$2b$' using:
 *   sqlite3 server/database.sqlite "SELECT id, name, substr(password, 1, 4) FROM teachers;"
 */

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

async function migratePasswords() {
    console.log('🔐 Starting password migration...\n');

    const users = await new Promise((resolve, reject) => {
        db.all("SELECT id, name, email, password FROM teachers", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    let migrated = 0;
    let alreadyHashed = 0;
    let noPassword = 0;

    for (const user of users) {
        if (!user.password) {
            // No password set — hash their user ID as default
            const hash = await bcrypt.hash(String(user.id), 10);
            await new Promise((resolve, reject) => {
                db.run("UPDATE teachers SET password = ? WHERE id = ?", [hash, user.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            noPassword++;
            console.log(`  ⚠️  User #${user.id} (${user.name}) — no password found, hashed ID as default`);
        } else if (user.password.startsWith('$2b$')) {
            alreadyHashed++;
        } else {
            // Plaintext password — hash it
            const hash = await bcrypt.hash(user.password, 10);
            await new Promise((resolve, reject) => {
                db.run("UPDATE teachers SET password = ? WHERE id = ?", [hash, user.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            migrated++;
            console.log(`  ✅ User #${user.id} (${user.name}) — password hashed`);
        }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total users:      ${users.length}`);
    console.log(`   Already hashed:   ${alreadyHashed}`);
    console.log(`   Newly hashed:     ${migrated}`);
    console.log(`   No password set:  ${noPassword}`);
    console.log(`\n✅ Migration complete!`);

    db.close();
}

migratePasswords().catch(err => {
    console.error('❌ Migration failed:', err);
    db.close();
    process.exit(1);
});
