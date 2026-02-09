const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getHodAnalytics, getAttendanceTrends } = require('../controllers/analyticsController');
const { getPredictiveAnalytics } = require('../controllers/predictiveAnalyticsController');

// Get aggregated analytics for current user
router.get('/summary', verifyToken, getHodAnalytics);
router.get('/attendance-trends', verifyToken, getAttendanceTrends);

// Get predictive analytics with AI-powered forecasting
router.get('/predictive', verifyToken, getPredictiveAnalytics);

module.exports = router;
