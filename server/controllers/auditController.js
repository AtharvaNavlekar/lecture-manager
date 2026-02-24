const { db } = require('../config/db');

// Get audit logs with filtering
// Get audit logs with filtering
const getAuditLogs = (req, res) => {
    const { user_type, action, resource, start_date, end_date, limit = 100 } = req.query;
    const userRole = req.userRole;

    // Only admins can view audit logs
    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }

    try {
        let sql = `SELECT * FROM audit_logs WHERE 1=1`;
        const params = [];

        // Apply filters
        if (user_type) {
            sql += ' AND user_type = ?';
            params.push(user_type);
        }

        if (action) {
            sql += ' AND action = ?';
            params.push(action);
        }

        if (resource) {
            sql += ' AND resource = ?';
            params.push(resource);
        }

        if (start_date) {
            sql += ' AND date(created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            sql += ' AND date(created_at) <= ?';
            params.push(end_date);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        // Using sqlite3 callback API
        db.all(sql, params, (err, logs) => {
            if (err) {
                console.error('❌ DB Error in getAuditLogs:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error fetching logs',
                    error: err.message
                });
            }

            res.json({
                success: true,
                logs,
                total: logs.length
            });
        });

    } catch (error) {
        console.error('❌ Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
};

// Get specific audit log
// Get specific audit log
const getAuditLog = (req, res) => {
    const { id } = req.params;
    const userRole = req.userRole;

    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }

    try {
        db.get('SELECT * FROM audit_logs WHERE id = ?', [id], (err, log) => {
            if (err) {
                console.error('❌ DB Error in getAuditLog:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (!log) {
                return res.status(404).json({
                    success: false,
                    message: 'Audit log not found'
                });
            }

            res.json({
                success: true,
                log
            });
        });

    } catch (error) {
        console.error('❌ Get audit log error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log'
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLog
};
