const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { login, register, logout, me } = require('../controllers/authController');
const { checkRateLimit } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validate');
const { verifyToken } = require('../middleware/authMiddleware');

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

// Login with rate limiting and validation
router.post('/login', checkRateLimit, validate(loginSchema), login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', verifyToken, me);

module.exports = router;
