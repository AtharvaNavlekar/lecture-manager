const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getHodAnalytics, getAttendanceTrends } = require('../controllers/analyticsController');
const { getPredictiveAnalytics } = require('../controllers/predictiveAnalyticsController');
const { db } = require('../config/db');

// Get aggregated analytics for current user
router.get('/summary', verifyToken, getHodAnalytics);
router.get('/attendance-trends', verifyToken, getAttendanceTrends);

// Get predictive analytics with AI-powered forecasting
router.get('/predictive', verifyToken, getPredictiveAnalytics);

// FIX BUG 10: Add lecture-velocity endpoint
router.get('/lecture-velocity', verifyToken, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().split('T')[0];
        
        const dbGet = require('util').promisify(db.all.bind(db));
        const data = await dbGet(
            `SELECT date, COUNT(*) as count FROM lectures 
             WHERE date >= ? 
             GROUP BY date 
             ORDER BY date ASC`,
            [sinceStr]
        );
        
        res.json({ success: true, data, days });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
