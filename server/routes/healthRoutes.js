const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

/**
 * Health Check Endpoint
 * Returns system status and diagnostics
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            checks: {}
        };

        // Database connectivity check
        try {
            const dbCheck = await new Promise((resolve) => {
                db.get('SELECT 1 as test', [], (err, row) => {
                    if (err) resolve({ connected: false, error: err.message });
                    else resolve({ connected: true });
                });
            });

            health.database = dbCheck.connected ? 'connected' : 'error';
            health.checks.database = dbCheck;
        } catch (err) {
            health.database = 'error';
            health.checks.database = { connected: false, error: err.message };
        }

        // Data counts
        try {
            const counts = await new Promise((resolve) => {
                const queries = [
                    'SELECT COUNT(*) as teachers FROM teachers',
                    'SELECT COUNT(*) as students FROM students',
                    'SELECT COUNT(*) as subjects FROM subjects',
                    'SELECT COUNT(*) as lectures FROM lectures',
                    'SELECT COUNT(*) as departments FROM departments WHERE is_active = 1'
                ];

                db.get(queries.join('; '), [], (err, row) => {
                    if (err) resolve({ error: err.message });
                    else resolve(row || {});
                });
            });

            health.checks.data = counts;
        } catch (err) {
            health.checks.data = { error: err.message };
        }

        // Department validation
        try {
            const deptCheck = await new Promise((resolve) => {
                db.all("SELECT COUNT(*) as bad FROM teachers WHERE department LIKE '%B.Sc%' OR department LIKE '%B_SC%'", [], (err, rows) => {
                    if (err) resolve({ normalized: false, error: err.message });
                    else resolve({ normalized: rows[0].bad === 0, badRecords: rows[0].bad });
                });
            });

            health.checks.departmentNormalization = deptCheck;
        } catch (err) {
            health.checks.departmentNormalization = { error: err.message };
        }

        // Overall status
        if (health.database !== 'connected') {
            health.status = 'unhealthy';
        } else if (health.checks.departmentNormalization && !health.checks.departmentNormalization.normalized) {
            health.status = 'degraded';
        }

        const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);

    } catch (err) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: err.message
        });
    }
});

module.exports = router;
