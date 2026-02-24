const { db } = require('../config/db');

// Generic CRUD operations for config tables
const createConfigController = (tableName) => ({
    // GET ALL
    getAll: (req, res) => {
        db.all(`SELECT * FROM ${tableName} WHERE is_active = 1 ORDER BY sort_order, name`, [], (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, [tableName]: rows });
        });
    },

    // GET ONE
    getById: (req, res) => {
        const { id } = req.params;
        db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, row) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!row) return res.status(404).json({ success: false, message: 'Not found' });
            res.json({ success: true, data: row });
        });
    },

    // CREATE
    create: (req, res) => {
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        db.run(
            `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
            values,
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({ success: true, id: this.lastID, message: `${tableName} created successfully` });
            }
        );
    },

    // UPDATE
    update: (req, res) => {
        const { id } = req.params;
        const data = req.body;
        const keys = Object.keys(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];

        db.run(
            `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values,
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
                res.json({ success: true, message: `${tableName} updated successfully` });
            }
        );
    },

    // DELETE (soft delete)
    delete: (req, res) => {
        const { id } = req.params;
        db.run(
            `UPDATE ${tableName} SET is_active = 0 WHERE id = ?`,
            [id],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                if (this.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
                res.json({ success: true, message: `${tableName} deleted successfully` });
            }
        );
    }
});

// Controllers
const departmentsController = createConfigController('departments');
const academicYearsController = createConfigController('academic_years');
const timeSlotsController = createConfigController('time_slots');
const divisionsController = createConfigController('divisions');
const roomsController = createConfigController('rooms');
const designationsController = createConfigController('designations');

// System Config Controller (special case - no soft delete, update by key)
const systemConfigController = {
    getAll: (req, res) => {
        db.all(`SELECT * FROM system_config ORDER BY category, key`, [], (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, configs: rows });
        });
    },

    getByKey: (req, res) => {
        const { key } = req.params;
        db.get(`SELECT * FROM system_config WHERE key = ?`, [key], (err, row) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!row) return res.status(404).json({ success: false, message: 'Config not found' });
            res.json({ success: true, config: row });
        });
    },

    update: (req, res) => {
        const { key } = req.params;
        const { value } = req.body;

        db.run(
            `UPDATE system_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`,
            [value, key],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                if (this.changes === 0) return res.status(404).json({ success: false, message: 'Config not found' });
                res.json({ success: true, message: 'Configuration updated successfully' });
            }
        );
    }
};

module.exports = {
    departmentsController,
    academicYearsController,
    timeSlotsController,
    divisionsController,
    roomsController,
    designationsController,
    systemConfigController
};
