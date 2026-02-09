const express = require('express');
const router = express.Router();
const { requestPasswordReset, resetPassword, verifyResetToken } = require('../controllers/passwordResetController');

// Request password reset
router.post('/forgot-password', requestPasswordReset);

// Verify reset token
router.get('/verify-reset-token/:token', verifyResetToken);

// Reset password with token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
