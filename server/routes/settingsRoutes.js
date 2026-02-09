const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
    getAllSettings,
    updateSettings,
    getSetting,
    updateSetting
} = require('../controllers/settingsController');

// Apply authentication to all routes
router.use(verifyToken);

// GET all settings
router.get('/', getAllSettings);

// UPDATE settings (Bulk update)
// UPDATE settings (Bulk update)
router.post('/', verifyAdmin, updateSettings);
router.put('/', verifyAdmin, updateSettings); // Alias for PUT requests

// GET a single setting by key
router.get('/:key', getSetting);

// UPDATE a single setting
router.put('/:key', verifyAdmin, updateSetting);

module.exports = router;
