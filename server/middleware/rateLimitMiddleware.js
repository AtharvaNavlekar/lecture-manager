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
        db.run(`
            INSERT INTO login_attempts (email, ip_address, success, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [email, ip_address, success ? 1 : 0], (err) => {
            if (err) console.error('Error tracking login attempt:', err);
        });
    } catch (error) {
        console.error('Error tracking login attempt:', error);
    }
};

// Check if IP or email is locked out (async callback-based)
const isLockedOut = (email, ip_address, callback) => {
    try {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

        db.get(`
            SELECT COUNT(*) as attempt_count
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
              AND success = 0
              AND created_at > ?
        `, [email, ip_address, lockoutTime.toISOString()], (err, result) => {
            if (err) {
                console.error('Error checking lockout:', err);
                return callback(false); // Fail open if there's an error
            }
            callback(result.attempt_count >= MAX_ATTEMPTS);
        });
    } catch (error) {
        console.error('Error checking lockout:', error);
        callback(false);
    }
};

// Get remaining attempts before lockout
const getRemainingAttempts = (email, ip_address, callback) => {
    try {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

        db.get(`
            SELECT COUNT(*) as attempt_count
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
              AND success = 0
              AND created_at > ?
        `, [email, ip_address, lockoutTime.toISOString()], (err, result) => {
            if (err) {
                console.error('Error getting remaining attempts:', err);
                return callback(MAX_ATTEMPTS);
            }
            const remaining = MAX_ATTEMPTS - result.attempt_count;
            callback(remaining > 0 ? remaining : 0);
        });
    } catch (error) {
        console.error('Error getting remaining attempts:', error);
        callback(MAX_ATTEMPTS);
    }
};

// Get unlock time if locked out
const getUnlockTime = (email, ip_address, callback) => {
    try {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - LOCKOUT_DURATION_MINUTES);

        db.get(`
            SELECT MAX(created_at) as last_attempt
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
              AND success = 0
              AND created_at > ?
        `, [email, ip_address, lockoutTime.toISOString()], (err, result) => {
            if (err) {
                console.error('Error getting unlock time:', err);
                return callback(null);
            }

            if (result && result.last_attempt) {
                const unlockTime = new Date(result.last_attempt);
                unlockTime.setMinutes(unlockTime.getMinutes() + LOCKOUT_DURATION_MINUTES);
                callback(unlockTime);
            } else {
                callback(null);
            }
        });
    } catch (error) {
        console.error('Error getting unlock time:', error);
        callback(null);
    }
};

// Clear successful login attempts
const clearLoginAttempts = (email, ip_address) => {
    try {
        trackLoginAttempt(email, ip_address, true);
    } catch (error) {
        console.error('Error clearing login attempts:', error);
    }
};

// Middleware to check rate limit before login
const checkRateLimit = (req, res, next) => {
    const { email } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;

    isLockedOut(email, ip_address, (locked) => {
        if (locked) {
            getUnlockTime(email, ip_address, (unlockTime) => {
                const minutesRemaining = unlockTime
                    ? Math.ceil((unlockTime - new Date()) / 60000)
                    : LOCKOUT_DURATION_MINUTES;

                return res.status(429).json({
                    success: false,
                    message: 'Too many failed login attempts. Please try again later.',
                    locked_out: true,
                    unlock_in_minutes: minutesRemaining,
                    unlock_at: unlockTime ? unlockTime.toISOString() : null
                });
            });
            return;
        }

        // Attach helper functions to request
        req.rateLimitHelpers = {
            trackAttempt: (success) => trackLoginAttempt(email, ip_address, success),
            clearAttempts: () => clearLoginAttempts(email, ip_address),
            getRemainingAttempts: (cb) => getRemainingAttempts(email, ip_address, cb)
        };

        next();
    });
};

// Cleanup old login attempts (run periodically)
const cleanupOldAttempts = () => {
    try {
        const cutoffTime = new Date();
        cutoffTime.setMinutes(cutoffTime.getMinutes() - LOCKOUT_DURATION_MINUTES * 2);

        db.run(`
            DELETE FROM login_attempts
            WHERE created_at < ?
        `, [cutoffTime.toISOString()], function (err) {
            if (err) {
                console.error('Error cleaning up login attempts:', err);
                return;
            }
            if (this.changes > 0) {
                console.log(`🧹 Cleaned up ${this.changes} old login attempts`);
            }
        });
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
