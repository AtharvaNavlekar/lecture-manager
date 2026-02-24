const dbAsync = require('../utils/dbAsync');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Password Reset Controller
 * Handles forgot password and reset password functionality
 */

// Request password reset (send email with token)
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    try {
        // Find user
        const user = await dbAsync.get('SELECT id, name, email FROM teachers WHERE email = ?', [email]);

        // Always return success for security (don't reveal if email exists)
        if (!user) {
            console.log(`🔒 Password reset attempted for non-existent email: ${email}`);
            return res.json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link.'
            });
        }

        // Generate reset token
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

        // Store token
        await dbAsync.run(`
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `, [user.id, token, expiresAt.toISOString()]);

        // TODO: Send email with reset link
        // For now, log the token (in production, send email)
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

        console.log(`📧 Password reset requested for ${email}`);
        console.log(`🔗 Reset link (DEV MODE): ${resetLink}`);

        // In development, return the link
        const response = {
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.'
        };

        // Only include link in development
        if (process.env.NODE_ENV !== 'production') {
            response.reset_link = resetLink;
            response.dev_note = 'This link is only shown in development mode';
        }

        res.json(response);

    } catch (error) {
        console.error('❌ Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
        return res.status(400).json({
            success: false,
            message: 'Token and new password are required'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
        });
    }

    try {
        // Find valid token
        const tokenData = await dbAsync.get(`
            SELECT * FROM password_reset_tokens
            WHERE token = ? AND used = 0
        `, [token]);

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check expiration
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);

        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please request a new one.'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and mark token used in transaction
        await dbAsync.transaction(async (tx) => {
            await tx.run('UPDATE teachers SET password = ? WHERE id = ?', [hashedPassword, tokenData.user_id]);
            await tx.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenData.id]);
        });

        console.log(`✅ Password reset successful for user ID ${tokenData.user_id}`);

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('❌ Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
};

// Verify token validity (for frontend to check before showing form)
const verifyResetToken = async (req, res) => {
    const { token } = req.params;

    try {
        const tokenData = await dbAsync.get(`
            SELECT expires_at FROM password_reset_tokens
            WHERE token = ? AND used = 0
        `, [token]);

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);

        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid'
        });

    } catch (error) {
        console.error('❌ Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify token'
        });
    }
};

module.exports = {
    requestPasswordReset,
    resetPassword,
    verifyResetToken
};
