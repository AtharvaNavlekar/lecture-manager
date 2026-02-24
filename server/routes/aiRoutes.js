const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

// ==================== RISK PREDICTION ====================
router.get('/forecast', verifyToken, aiController.getRiskForecast);

// ==================== SMART RECOMMENDATIONS ====================
router.post('/substitute-recommendations', verifyToken, aiController.getSubstituteRecommendations);

// ==================== TREND ANALYSIS & FORECASTING ====================
router.get('/student-trend/:studentId', verifyToken, aiController.getStudentTrend);
router.get('/anomalies', verifyToken, aiController.detectAnomalies);
router.get('/resource-forecast', verifyToken, aiController.getResourceForecast);

// ==================== OPTIMIZATION ====================
router.get('/conflicts', verifyToken, aiController.findConflicts);
router.get('/load-balancing', verifyToken, aiController.getLoadBalancing);
router.get('/room-utilization', verifyToken, aiController.getRoomUtilization);
router.get('/scheduling-recommendations', verifyToken, aiController.getSchedulingRecommendations);

// ==================== NATURAL LANGUAGE QUERIES ====================
router.post('/query', verifyToken, aiController.processNaturalQuery);
router.get('/query-suggestions', verifyToken, aiController.getQuerySuggestions);

module.exports = router;
