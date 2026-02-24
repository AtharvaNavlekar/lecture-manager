const { db } = require('../config/db');

/**
 * Logs a sensitive action to the database
 * @param {Object} req - The Express request object (to extract user info & IP)
 * @param {string} action - Short code for action (e.g. 'DELETE_USER')
 * @param {string} target - What was acted upon (e.g. 'User: 123')
 * @param {string} details - Readable description or JSON
 */
const logAction = (req, action, target, details) => {
    try {
        const userId = req.userId || null;
        const userType = req.userRole || 'system';
        // We might not have user_name in req, usually just ID/Role. 
        // We can fetch it or just log ID. For speed, we log ID.
        // IP Address extraction
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

        const stmt = db.prepare("INSERT INTO audit_logs (user_id, user_type, action, resource, details, ip_address) VALUES (?,?,?,?,?,?)");
        stmt.run(userId, userType, action, target, details, ip, (err) => {
            if (err) console.error("Audit Log Failed:", err.message);
        });
        stmt.finalize();
    } catch (e) {
        console.error("Audit Service Error:", e);
    }
};

const getLogs = (req, res) => {
    const { limit = 50, action } = req.query;
    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    const params = [];

    if (action) {
        sql += " AND action = ?";
        params.push(action);
    }

    sql += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, logs: rows });
    });
};

module.exports = { logAction, getLogs };
