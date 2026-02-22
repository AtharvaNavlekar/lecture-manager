const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { login, register } = require('../controllers/authController');
const { checkRateLimit } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validate');

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

// Login with rate limiting and validation
router.post('/login', checkRateLimit, validate(loginSchema), login);
router.post('/register', register);

module.exports = router;
