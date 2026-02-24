const express = require('express');
const router = express.Router();
const { getLogs } = require('../services/auditService');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
    factoryReset,
    downloadBackup,
    getSystemStats,
    getEmailServiceStatus,
    createManualBackup,
    getAllBackups,
    getBackupServiceStatus,
    restoreFromBackup,
    removeBackup,
    getAllUsersWithRoles,
    assignRole,
    revealPassword,
    setTempPassword
} = require('../controllers/adminController');

// Apply authentication to all routes
router.use(verifyToken);

// User Management
router.get('/users-credentials', verifyAdmin, getAllUsersWithRoles);
router.post('/assign-role', verifyAdmin, assignRole);
router.get('/users-credentials/:teacher_id/reveal', verifyAdmin, revealPassword);
router.post('/users-credentials/set-temp', verifyAdmin, setTempPassword);

// Audit logs
router.get('/audit-logs', verifyAdmin, getLogs);

// Factory reset
router.post('/factory-reset', verifyAdmin, factoryReset);

// System statistics
router.get('/stats', verifyAdmin, getSystemStats);

// Email Service
router.get('/email/status', verifyAdmin, getEmailServiceStatus);

// Backup Service
router.get('/backup/download', verifyAdmin, downloadBackup); // Download current DB
router.post('/backup/create', verifyAdmin, createManualBackup); // Create manual backup
router.get('/backup/list', verifyAdmin, getAllBackups); // List all backups
router.get('/backup/status', verifyAdmin, getBackupServiceStatus); // Get backup service status
router.post('/backup/restore', verifyAdmin, restoreFromBackup); // Restore from backup
router.delete('/backup/:filename', verifyAdmin, removeBackup); // Delete specific backup

module.exports = router;
