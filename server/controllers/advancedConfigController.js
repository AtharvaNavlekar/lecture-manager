const { db } = require('../config/db');
const { validateImport } = require('../middleware/validation');

// Log configuration change
function logConfigChange(tableName, recordId, action, oldValue, newValue, userId) {
    db.run(
        `INSERT INTO config_audit (table_name, record_id, action, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)`,
        [tableName, recordId, action, JSON.stringify(oldValue), JSON.stringify(newValue), userId],
        (err) => {
            if (err) console.error('Audit log error:', err);
        }
    );
}

// Middleware to log config changes
const auditConfigChanges = (tableName) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        const recordId = req.params.id;
        const action = req.method === 'POST' ? 'CREATE' : req.method === 'PUT' ? 'UPDATE' : req.method === 'DELETE' ? 'DELETE' : null;

        if (!action) return next();

        let oldValue = null;
        if (action === 'UPDATE' || action === 'DELETE') {
            oldValue = await new Promise((resolve) => {
                db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [recordId], (err, row) => {
                    resolve(row);
                });
            });
        }

        res.send = function (data) {
            const userId = req.user?.id || null;
            const newValue = action === 'DELETE' ? null : req.body;

            logConfigChange(tableName, recordId || 'new', action, oldValue, newValue, userId);

            originalSend.apply(res, arguments);
        };

        next();
    };
};

// Get audit logs
const getAuditLogs = (req, res) => {
    const { table_name, limit = 100 } = req.query;

    let query = `
        SELECT ca.*, u.name as changed_by_name 
        FROM config_audit ca 
        LEFT JOIN teachers u ON ca.changed_by = u.id
        WHERE 1=1
    `;
    const params = [];

    if (table_name) {
        query += ` AND ca.table_name = ?`;
        params.push(table_name);
    }

    query += ` ORDER BY ca.changed_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, logs: rows });
    });
};

// Get templates
const getTemplates = (req, res) => {
    db.all(`SELECT * FROM config_templates ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, templates: rows });
    });
};

// Apply template
const applyTemplate = async (req, res) => {
    const { id } = req.params;
    const { merge = false } = req.body; // merge or replace

    try {
        // Get template
        const template = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM config_templates WHERE id = ?`, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        const config = JSON.parse(template.config_data);

        // Apply academic years
        if (config.academicYears && !merge) {
            await new Promise((resolve) => db.run(`DELETE FROM academic_years`, resolve));
        }
        if (config.academic_years) {
            for (const year of config.academic_years) {
                await new Promise((resolve) => {
                    db.run(
                        `INSERT OR REPLACE INTO academic_years (code, name, display_name, sort_order) VALUES (?, ?, ?, ?)`,
                        [year.code, year.name, year.code, year.sort_order],
                        resolve
                    );
                });
            }
        }

        // Apply time slots
        if (config.time_slots && !merge) {
            await new Promise((resolve) => db.run(`DELETE FROM time_slots`, resolve));
        }
        if (config.time_slots) {
            for (const slot of config.time_slots) {
                await new Promise((resolve) => {
                    db.run(
                        `INSERT OR REPLACE INTO time_slots (name, start_time, end_time, slot_type, sort_order) VALUES (?, ?, ?, ?, ?)`,
                        [slot.name, slot.start_time, slot.end_time, slot.slot_type, slot.sort_order],
                        resolve
                    );
                });
            }
        }

        // Apply divisions
        if (config.divisions && !merge) {
            await new Promise((resolve) => db.run(`DELETE FROM divisions`, resolve));
        }
        if (config.divisions) {
            for (const div of config.divisions) {
                await new Promise((resolve) => {
                    db.run(
                        `INSERT OR REPLACE INTO divisions (code, name, sort_order) VALUES (?, ?, ?)`,
                        [div.code, div.name, div.sort_order],
                        resolve
                    );
                });
            }
        }

        res.json({ success: true, message: 'Template applied successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk export
const bulkExport = (req, res) => {
    const { type } = req.params; // departments, academic-years, time-slots, etc.

    const tableMap = {
        'departments': 'departments',
        'academic-years': 'academic_years',
        'time-slots': 'time_slots',
        'divisions': 'divisions',
        'rooms': 'rooms',
        'designations': 'designations'
    };

    const table = tableMap[type];
    if (!table) {
        return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    db.all(`SELECT * FROM ${table} WHERE is_active = 1`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Convert to CSV
        if (rows.length === 0) {
            return res.json({ success: true, data: [], csv: '' });
        }

        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(','),
            ...rows.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
        res.send(csv);
    });
};

// Bulk import
const bulkImport = (req, res) => {
    const { type } = req.params;
    const { data } = req.body; // Array of objects

    const tableMap = {
        'departments': 'departments',
        'academic-years': 'academic_years',
        'time-slots': 'time_slots',
        'divisions': 'divisions',
        'rooms': 'rooms',
        'designations': 'designations'
    };

    const table = tableMap[type];
    if (!table) {
        return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ success: false, message: 'Data must be a non-empty array' });
    }

    // Validate Data
    const validationErrors = validateImport(data, type);
    if (validationErrors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    const promises = data.map(item => {
        return new Promise((resolve, reject) => {
            const keys = Object.keys(item).filter(k => k !== 'id');
            const values = keys.map(k => item[k]);
            const placeholders = keys.map(() => '?').join(', ');

            db.run(
                `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                values,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    });

    Promise.all(promises)
        .then(() => res.json({ success: true, message: `Imported ${data.length} records`, count: data.length }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
};

module.exports = {
    auditConfigChanges,
    getAuditLogs,
    getTemplates,
    applyTemplate,
    bulkExport,
    bulkImport
};
