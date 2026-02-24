const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

console.log('🔧 FIXING LECTURES TABLE SCHEMA');
console.log('================================\n');
console.log('Database:', dbPath);
console.log('\n**IMPORTANT**: This script will recreate the lectures table.');
console.log('A backup will be created automatically.\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to connect to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database\n');
});

db.serialize(() => {
    // Step 1: Get current row count
    db.get('SELECT COUNT(*) as count FROM lectures', [], (err, row) => {
        if (err) {
            console.error('❌ Failed to count lectures:', err.message);
            process.exit(1);
        }
        const lectureCount = row.count;
        console.log(`📊 Current lectures in database: ${lectureCount}\n`);

        // Step 2: Create backup table
        console.log('📋 Step 1/5: Creating backup table...');
        db.run('CREATE TABLE lectures_backup AS SELECT * FROM lectures', (err) => {
            if (err) {
                console.error('❌ Backup creation failed:', err.message);
                process.exit(1);
            }
            console.log('✅ Backup table created\n');

            // Step 3: Drop original table
            console.log('📋 Step 2/5: Dropping original table...');
            db.run('DROP TABLE lectures', (err) => {
                if (err) {
                    console.error('❌ Drop table failed:', err.message);
                    console.log('Attempting to restore from backup...');
                    db.run('ALTER TABLE lectures_backup RENAME TO lectures', () => process.exit(1));
                    return;
                }
                console.log('✅ Original table dropped\n');

                // Step 4: Create new table with correct schema (NO NOT NULL on start_time/end_time)
                console.log('📋 Step 3/5: Creating new table with corrected schema...');
                db.run(`
                    CREATE TABLE lectures (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        scheduled_teacher_id INTEGER NOT NULL,
                        substitute_teacher_id INTEGER,
                        subject TEXT NOT NULL,
                        class_year TEXT NOT NULL,
                        date TEXT NOT NULL,
                        start_time TEXT,
                        end_time TEXT,
                        room TEXT DEFAULT 'Room-101',
                        status TEXT DEFAULT 'scheduled',
                        total_students INTEGER DEFAULT 60,
                        attendance_count INTEGER DEFAULT 0,
                        topic_covered TEXT,
                        syllabus_topic_id INTEGER,
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        division TEXT DEFAULT 'A',
                        day_of_week TEXT,
                        time_slot TEXT,
                        FOREIGN KEY (scheduled_teacher_id) REFERENCES teachers(id),
                        FOREIGN KEY (substitute_teacher_id) REFERENCES teachers(id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('❌ Table creation failed:', err.message);
                        console.log('Attempting to restore from backup...');
                        db.run('ALTER TABLE lectures_backup RENAME TO lectures', () => process.exit(1));
                        return;
                    }
                    console.log('✅ New table created (start_time & end_time now allow NULL)\n');

                    // Step 5: Restore data from backup
                    console.log('📋 Step 4/5: Restoring data from backup...');
                    db.run('INSERT INTO lectures SELECT * FROM lectures_backup', (err) => {
                        if (err) {
                            console.error('❌ Data restore failed:', err.message);
                            console.error('⚠️  CRITICAL: Backup table still exists (lectures_backup)');
                            process.exit(1);
                        }

                        // Verify count
                        db.get('SELECT COUNT(*) as count FROM lectures', [], (err, row) => {
                            if (err || row.count !== lectureCount) {
                                console.error('❌ Data verification failed!');
                                console.error(`Expected: ${lectureCount}, Got: ${row ? row.count : 'ERROR'}`);
                                console.error('⚠️  Backup table still exists (lectures_backup)');
                                process.exit(1);
                            }
                            console.log(`✅ Data restored (${row.count} lectures)\n`);

                            // Step 6: Drop backup table
                            console.log('📋 Step 5/5: Cleaning up backup...');
                            db.run('DROP TABLE lectures_backup', (err) => {
                                if (err) {
                                    console.warn('⚠️  Warning: Could not drop backup table:', err.message);
                                    console.warn('   You can manually drop it later: DROP TABLE lectures_backup;');
                                } else {
                                    console.log('✅ Backup table removed\n');
                                }

                                // Success!
                                console.log('============================================');
                                console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
                                console.log('============================================\n');
                                console.log('📊 Summary:');
                                console.log(`   - Lectures migrated: ${lectureCount}`);
                                console.log('   - Schema updated: start_time & end_time now allow NULL');
                                console.log('   - Backup cleaned up\n');
                                console.log('🚀 You can now submit substitute requests!\n');

                                db.close(() => {
                                    process.exit(0);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Handle errors
db.on('error', (err) => {
    console.error('❌ Database error:', err.message);
    process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Migration interrupted!');
    console.log('   Check if lectures_backup table exists.');
    console.log('   If yes, you can restore: ALTER TABLE lectures_backup RENAME TO lectures;\n');
    db.close(() => {
        process.exit(1);
    });
});
