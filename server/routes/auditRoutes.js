const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLog } = require('../controllers/auditController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Get audit logs (admin only)
router.get('/', verifyToken, verifyAdmin, getAuditLogs);

// Get specific audit log (admin only)
router.get('/:id', verifyToken, verifyAdmin, getAuditLog);

module.exports = router;
