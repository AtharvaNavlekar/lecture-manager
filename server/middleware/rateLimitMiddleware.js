const { db } = require('../config/db');

/**
 * Rate limiting middleware to prevent brute force attacks
 * Tracks login attempts by IP and email
 * Locks account after 5 failed attempts for 15 minutes
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const CLEANUP_INTERVAL_MINUTES = 60;

// Track failed login attempts
const trackLoginAttempt = (email, ip_address, success) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO login_attempts (email, ip_address, success, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(email, ip_address, success ? 1 : 0);
    } catch (error) {
        console.error('Error tracking login attempt:', error);
    }
};

// Check if IP or email is locked out
const isLockedOut = (email, ip_address) => {
    try {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

        // Check failed attempts in last 15 minutes
        const stmt = db.prepare(`
            SELECT COUNT(*) as attempt_count
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
              AND success = 0
              AND created_at > ?
        `);

        const result = stmt.get(email, ip_address, lockoutTime.toISOString());

        return result.attempt_count >= MAX_ATTEMPTS;
    } catch (error) {
        console.error('Error checking lockout:', error);
        return false; // Fail open if there's an error
    }
};

// Get remaining attempts before lockout
const getRemainingAttempts = (email, ip_address) => {
    try {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

        const stmt = db.prepare(`
            SELECT COUNT(*) as attempt_count
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
              AND success = 0
              AND created_at > ?
        `);

        const result = stmt.get(email, ip_address, lockoutTime.toISOString());
        const remaining = MAX_ATTEMPTS - result.attempt_count;

        return remaining > 0 ? remaining : 0;
    } catch (error) {
        console.error('Error getting remaining attempts:', error);
        return MAX_ATTEMPTS; // Fail open
    }
};

// Get unlock time if locked out
const getUnlockTime = (email, ip_address) => {
    try {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

        const stmt = db.prepare(`
            SELECT MAX(created_at) as last_attempt
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
              AND success = 0
              AND created_at > ?
        `);

        const result = stmt.get(email, ip_address, lockoutTime.toISOString());

        if (result.last_attempt) {
            const unlockTime = new Date(result.last_attempt);
            unlockTime.setMinutes(unlockTime.getMinutes() + LOCKOUT_DURATION_MINUTES);
            return unlockTime;
        }

        return null;
    } catch (error) {
        console.error('Error getting unlock time:', error);
        return null;
    }
};

// Clear successful login attempts
const clearLoginAttempts = (email, ip_address) => {
    try {
        // Mark as successful to reset the counter
        trackLoginAttempt(email, ip_address, true);
    } catch (error) {
        console.error('Error clearing login attempts:', error);
    }
};

// Middleware to check rate limit before login
const checkRateLimit = (req, res, next) => {
    const { email } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;

    if (isLockedOut(email, ip_address)) {
        const unlockTime = getUnlockTime(email, ip_address);
        const minutesRemaining = unlockTime
            ? Math.ceil((unlockTime - new Date()) / 60000)
            : LOCKOUT_DURATION_MINUTES;

        console.log(`🔒 Login attempt blocked: ${email} from ${ip_address}`);

        return res.status(429).json({
            success: false,
            message: 'Too many failed login attempts. Please try again later.',
            locked_out: true,
            unlock_in_minutes: minutesRemaining,
            unlock_at: unlockTime ? unlockTime.toISOString() : null
        });
    }

    // Attach helper functions to request
    req.rateLimitHelpers = {
        trackAttempt: (success) => trackLoginAttempt(email, ip_address, success),
        clearAttempts: () => clearLoginAttempts(email, ip_address),
        getRemainingAttempts: () => getRemainingAttempts(email, ip_address)
    };

    next();
};

// Cleanup old login attempts (run periodically)
const cleanupOldAttempts = () => {
    try {
        const cutoffTime = new Date();
        cutoffTime.setMinutes(cutoffTime.getMinutes() - LOCKOUT_DURATION_MINUTES * 2);

        const stmt = db.prepare(`
            DELETE FROM login_attempts
            WHERE created_at < ?
        `);

        const result = stmt.run(cutoffTime.toISOString());

        if (result.changes > 0) {
            console.log(`🧹 Cleaned up ${result.changes} old login attempts`);
        }
    } catch (error) {
        console.error('Error cleaning up login attempts:', error);
    }
};

// Schedule cleanup every hour
setInterval(cleanupOldAttempts, CLEANUP_INTERVAL_MINUTES * 60 * 1000);

module.exports = {
    checkRateLimit,
    trackLoginAttempt,
    clearLoginAttempts,
    isLockedOut,
    getRemainingAttempts,
    getUnlockTime,
    cleanupOldAttempts
};
