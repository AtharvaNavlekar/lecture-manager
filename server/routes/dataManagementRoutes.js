const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { promisify } = require('util');
const { logAction } = require('../services/auditService');

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// GET data statistics for all modules
router.get('/data-stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            dbGet('SELECT COUNT(*) as count FROM students'),
            dbGet('SELECT COUNT(*) as count FROM teachers'),
            dbGet('SELECT COUNT(*) as count FROM lectures'),
            dbGet('SELECT COUNT(*) as count FROM leave_requests'),
            dbGet('SELECT COUNT(*) as count FROM substitute_assignments'),
            dbGet('SELECT COUNT(*) as count FROM attendance_records'),
            dbGet('SELECT COUNT(*) as count FROM subjects'),
            dbGet('SELECT COUNT(*) as count FROM syllabus_topics') // Added syllabus_topics
        ]);

        res.json({
            success: true,
            stats: {
                students: stats[0].count,
                teachers: stats[1].count,
                lectures: stats[2].count,
                leaves: stats[3].count,
                substitutes: stats[4].count,
                attendance: stats[5].count,
                subjects: stats[6].count,
                syllabus: stats[7].count // Added syllabus
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST clear specific module data
router.post('/clear-module', async (req, res) => {
    try {
        const { module } = req.body;

        const moduleTableMap = {
            'students': 'students',
            'teachers': 'teachers',
            'lectures': 'lectures',
            'subjects': 'subjects',
            'syllabus': 'syllabus_topics', // Added syllabus
            'leaves': 'leave_requests',
            'substitutes': null, // Special handling for substitutes
            'attendance': 'attendance_records'
        };

        if (!moduleTableMap.hasOwnProperty(module)) {
            return res.status(400).json({ success: false, message: 'Invalid module' });
        }

        if (module === 'substitutes') {
            await dbRun("UPDATE lectures SET substitute_teacher_id = NULL, status = 'Scheduled' WHERE substitute_teacher_id IS NOT NULL");
            logAction(req, 'CLEAR_DATA', 'Data Management', `Cleared substitute assignments`);
            return res.json({ success: true, message: 'Substitute assignments cleared' });
        }

        const tableName = moduleTableMap[module];
        await dbRun(`DELETE FROM ${tableName}`);
        await dbRun(`DELETE FROM sqlite_sequence WHERE name='${tableName}'`); // Reset sequence

        logAction(req, 'CLEAR_DATA', 'Data Management', `Cleared ${module} data`);
        res.json({
            success: true,
            message: `${module} data cleared successfully`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST factory reset - Moved to adminRoutes/adminController
// router.post('/factory-reset', ...) removed to prevent routing conflict

module.exports = router;
