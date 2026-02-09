const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// Global search endpoint
router.get('/', globalSearch);

module.exports = router;
