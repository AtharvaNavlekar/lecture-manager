const { encrypt, decrypt } = require('../utils/vault');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔐 Testing Vault Logic...');

// 1. Test Encrypt/Decrypt Isolation
const manualTest = () => {
    const original = "MySecretPass123";
    const enc = encrypt(original);
    console.log(`\n1. Unit Test:`);
    console.log(`   Original: ${original}`);
    console.log(`   Encrypted: ${enc}`);

    if (!enc) {
        console.error('❌ Encryption Failed (Returned null). Check Key length/IV.');
        return false;
    }

    const dec = decrypt(enc);
    console.log(`   Decrypted: ${dec}`);

    if (dec === original) {
        console.log('✅ Unit Test PASSED.');
        return true;
    } else {
        console.error('❌ Decryption Mismatch.');
        return false;
    }
};

if (!manualTest()) process.exit(1);

// 2. Test DB Update (Simulate setTempPassword)
console.log('\n2. DB Update Simulation:');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const TEST_EMAIL = 'admin@college.edu'; // Use Admin for test
const TEST_PASS = 'NewVaultPass789';

db.serialize(() => {
    const encPass = encrypt(TEST_PASS);

    // Update
    db.run(`UPDATE teachers SET encrypted_password = ? WHERE email = ?`, [encPass, TEST_EMAIL], function (err) {
        if (err) {
            console.error('❌ DB Update Failed:', err.message);
            return;
        }
        console.log(`   Updated ${this.changes} row(s) for ${TEST_EMAIL}`);

        // Read Back
        db.get(`SELECT encrypted_password FROM teachers WHERE email = ?`, [TEST_EMAIL], (err, row) => {
            if (err) console.error('Read error:', err);
            else if (!row) console.error('User not found');
            else {
                console.log('   Stored Value:', row.encrypted_password);
                const decPass = decrypt(row.encrypted_password);
                console.log('   Decrypted Value:', decPass);

                if (decPass === TEST_PASS) console.log('✅ DB Integration PASSED.');
                else console.log('❌ DB Integration FAILED.');
            }
        });
    });
});
