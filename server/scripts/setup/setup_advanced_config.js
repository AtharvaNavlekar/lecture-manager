const { db } = require('../config/db');

// CREATE TABLE for config audit
async function createConfigAuditTable() {
    return new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS config_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                changed_by INTEGER,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating config_audit:", err);
            else console.log("✅ Created config_audit table");
            resolve();
        });
    });
}

// CREATE TABLE for config templates
async function createConfigTemplatesTable() {
    return new Promise((resolve) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS config_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL,
                config_data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error("Error creating config_templates:", err);
            else console.log("✅ Created config_templates table");
            resolve();
        });
    });
}

// Seed default templates
async function seedTemplates() {
    const templates = [
        {
            name: '3-Year Program',
            description: 'Standard 3-year undergraduate program (FY, SY, TY)',
            type: '3-year',
            config_data: JSON.stringify({
                academic_years: [
                    { code: 'FY', name: 'First Year', sort_order: 1 },
                    { code: 'SY', name: 'Second Year', sort_order: 2 },
                    { code: 'TY', name: 'Third Year', sort_order: 3 }
                ],
                time_slots: [
                    { name: 'Period 1', start_time: '08:00', end_time: '10:00', slot_type: 'lecture', sort_order: 1 },
                    { name: 'Short Break', start_time: '10:00', end_time: '10:15', slot_type: 'break', sort_order: 2 },
                    { name: 'Period 2', start_time: '10:15', end_time: '11:15', slot_type: 'lecture', sort_order: 3 },
                    { name: 'Period 3', start_time: '11:15', end_time: '12:15', slot_type: 'lecture', sort_order: 4 },
                    { name: 'Lunch Break', start_time: '12:15', end_time: '12:45', slot_type: 'break', sort_order: 5 },
                    { name: 'Period 4', start_time: '12:45', end_time: '13:45', slot_type: 'lecture', sort_order: 6 },
                    { name: 'Period 5', start_time: '13:45', end_time: '14:45', slot_type: 'lecture', sort_order: 7 }
                ],
                divisions: [
                    { code: 'A', name: 'Division A', sort_order: 1 },
                    { code: 'B', name: 'Division B', sort_order: 2 }
                ]
            })
        },
        {
            name: '4-Year Program',
            description: '4-year undergraduate program (FY, SY, TY, Fourth Year)',
            type: '4-year',
            config_data: JSON.stringify({
                academic_years: [
                    { code: 'FY', name: 'First Year', sort_order: 1 },
                    { code: 'SY', name: 'Second Year', sort_order: 2 },
                    { code: 'TY', name: 'Third Year', sort_order: 3 },
                    { code: 'Fourth_Year', name: 'Fourth Year', sort_order: 4 }
                ]
            })
        },
        {
            name: 'Semester System',
            description: '8-semester system (Sem 1-8)',
            type: 'semester',
            config_data: JSON.stringify({
                academic_years: [
                    { code: 'Sem1', name: 'Semester 1', sort_order: 1 },
                    { code: 'Sem2', name: 'Semester 2', sort_order: 2 },
                    { code: 'Sem3', name: 'Semester 3', sort_order: 3 },
                    { code: 'Sem4', name: 'Semester 4', sort_order: 4 },
                    { code: 'Sem5', name: 'Semester 5', sort_order: 5 },
                    { code: 'Sem6', name: 'Semester 6', sort_order: 6 },
                    { code: 'Sem7', name: 'Semester 7', sort_order: 7 },
                    { code: 'Sem8', name: 'Semester 8', sort_order: 8 }
                ]
            })
        }
    ];

    console.log("\n🌱 Seeding configuration templates...");
    for (const template of templates) {
        await new Promise((resolve) => {
            db.run(
                `INSERT OR IGNORE INTO config_templates (name, description, type, config_data) VALUES (?, ?, ?, ?)`,
                [template.name, template.description, template.type, template.config_data],
                () => resolve()
            );
        });
    }
    console.log(`✅ Seeded ${templates.length} templates\n`);
}

async function setup() {
    console.log("🚀 Setting up advanced configuration features...\n");

    await createConfigAuditTable();
    await createConfigTemplatesTable();
    await seedTemplates();

    console.log("\n✅ Advanced configuration setup complete!");
}

setup()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
