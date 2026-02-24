const express = require('express');
const router = express.Router();
const { requestPasswordReset, resetPassword, verifyResetToken } = require('../controllers/passwordResetController');
const { checkRateLimit } = require('../middleware/rateLimitMiddleware');

// Request password reset
router.post('/forgot-password', checkRateLimit, requestPasswordReset);

// Verify reset token
router.get('/verify-reset-token/:token', verifyResetToken);

// Reset password with token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
