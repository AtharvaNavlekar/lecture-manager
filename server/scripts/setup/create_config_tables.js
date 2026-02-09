const { db } = require('../config/db');

async function createDynamicConfigTables() {
    console.log("🏗️  Creating Dynamic Configuration Tables...\n");

    // 1. Departments Table
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                short_name TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ departments:", err.message);
            else console.log("✅ Created: departments");
            resolve();
        });
    });

    // 2. Academic Years (Class Years)
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS academic_years (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                display_name TEXT,
                sort_order INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ academic_years:", err.message);
            else console.log("✅ Created: academic_years");
            resolve();
        });
    });

    // 3. Time Slots
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS time_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                slot_type TEXT DEFAULT 'lecture',
                sort_order INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ time_slots:", err.message);
            else console.log("✅ Created: time_slots");
            resolve();
        });
    });

    // 4. Divisions
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS divisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ divisions:", err.message);
            else console.log("✅ Created: divisions");
            resolve();
        });
    });

    // 5. Rooms
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                building TEXT,
                floor INTEGER,
                capacity INTEGER DEFAULT 60,
                room_type TEXT DEFAULT 'classroom',
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ rooms:", err.message);
            else console.log("✅ Created: rooms");
            resolve();
        });
    });

    // 6. System Configuration
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS system_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                data_type TEXT DEFAULT 'string',
                category TEXT,
                description TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ system_config:", err.message);
            else console.log("✅ Created: system_config");
            resolve();
        });
    });

    // 7. Designations
    await new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS designations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("❌ designations:", err.message);
            else console.log("✅ Created: designations");
            resolve();
        });
    });

    console.log("\n✅ All configuration tables created successfully!");
}

createDynamicConfigTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
