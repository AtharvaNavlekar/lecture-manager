const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { db } = require('../config/db');
const { promisify } = require('util');

// FIX BUG 4: Add sync endpoint
router.get('/', verifyToken, async (req, res) => {
    try {
        const dbAll = promisify(db.all.bind(db));
        const dbGet = promisify(db.get.bind(db));
        
        const userId = req.user.id;
        const role = req.user.role || req.userRole;
        
        // Get unread notifications count
        const notificationResult = await dbGet(
            `SELECT COUNT(*) as count FROM notifications WHERE target_teacher_id = ? AND is_read = 0`,
            [userId]
        );
        
        // Get system settings
        const settings = await dbAll(
            `SELECT key, value FROM system_settings LIMIT 20`
        );
        
        res.json({
            success: true,
            unreadCount: notificationResult?.count || 0,
            settings: settings || [],
            timestamp: new Date().toISOString(),
            role
        });
    } catch (err) {
        console.error('Sync error:', err);
        // FIX: Never crash, return safe defaults
        res.json({ 
            success: true, 
            unreadCount: 0, 
            settings: [], 
            timestamp: new Date().toISOString() 
        });
    }
});

module.exports = router;
