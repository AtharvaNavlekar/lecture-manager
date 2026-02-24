const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// ==================== GET NOTIFICATIONS ====================
router.get('/', notificationController.getNotifications);

// ==================== REAL-TIME SSE STREAM ====================
router.get('/stream', notificationController.streamNotifications);

// ==================== NOTIFICATION PREFERENCES ====================
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

// ==================== NOTIFICATION ACTIONS ====================
router.post('/mark-read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.delete('/', notificationController.deleteNotifications);

module.exports = router;
