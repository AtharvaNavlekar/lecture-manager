const express = require('express');
const router = express.Router();
const { getHodStats, delegateAuthority, getAnalytics } = require('../controllers/hodController');
const { verifyToken, verifyHod } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

router.get('/stats', verifyHod, getHodStats);
router.get('/analytics', verifyHod, getAnalytics);
router.post('/delegate', verifyHod, delegateAuthority);

module.exports = router;
