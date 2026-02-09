const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const { checkRateLimit } = require('../middleware/rateLimitMiddleware');

// Login with rate limiting
router.post('/login', checkRateLimit, login);
router.post('/register', register);

module.exports = router;
