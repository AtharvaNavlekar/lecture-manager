const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
    let token = req.cookies?.token || req.headers['authorization'];

    // Check query param (for SSE)
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided.' });
    }

    // Expecting format: "Bearer <token>" or raw token from cookie
    let tokenValue = token;
    if (token.startsWith && token.startsWith('Bearer ')) {
        tokenValue = token.split(' ')[1];
    }

    if (!tokenValue) {
        return res.status(403).json({ success: false, message: 'Malformed token.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    jwt.verify(tokenValue, jwtSecret, (err, decoded) => {
        if (err) {
            logger.error('JWT Verification failed:', err.message);
            return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
        }

        logger.debug('JWT verified for user ID:', decoded.id);

        if (decoded.id === 0) {
            req.userId = 0;
            req.userRole = 'admin';
            req.userDept = 'Administration';
            req.user = {
                id: 0,
                name: 'System Setup Administrator',
                email: process.env.ADMIN_EMAIL || 'admin@college.edu',
                department: 'Administration',
                role: 'admin',
                is_fixed_admin: true
            };
            return next();
        }

        const { getDB } = require('../config/db');
        const db = getDB();

        db.get("SELECT id, name, email, department, is_hod, is_acting_hod, post FROM teachers WHERE id = ?", [decoded.id], (err, user) => {
            if (err) {
                logger.error('Database error during user lookup:', err);
                return res.status(401).json({ success: false, message: 'Database error during authentication.' });
            }

            // FIX BUG 12: Set role from token or fallback to database
            let userRole = decoded.role || 'teacher';
            
            // If role is missing from token, compute from DB
            if (!decoded.role && user) {
                if (user.department === 'Administration' || user.department === 'Admin') {
                    userRole = 'admin';
                } else if (user.is_hod === 1 || user.is_acting_hod === 1) {
                    userRole = 'hod';
                }
            }

            if (!user) {
                logger.error('User not found in database. ID:', decoded.id);
                return res.status(401).json({ success: false, message: 'User no longer exists or access revoked.' });
            }

            logger.debug('User authenticated:', user.id);

            req.userId = user.id;
            req.userRole = userRole; // Source of truth
            req.userDept = user.department;
            req.user = user; // Full user object for controllers
            req.user.role = userRole; // Add role to user object
            next();
        });
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.userRole === 'admin') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Require Admin Role.' });
        }
    });
}

const verifyHod = (req, res, next) => {
    // OPTIMIZATION: Use already-fetched user data from verifyToken
    // This eliminates duplicate database query and reduces latency

    if (!req.user) {
        logger.error('verifyHod: No user data found. verifyToken must be called first.');
        return res.status(500).json({ success: false, message: "Authentication required" });
    }

    // Check HOD privileges from already-loaded user object
    const isHod = req.user.is_hod === 1;
    const isActingHod = req.user.is_acting_hod === 1;
    const isAdmin = req.userRole === 'admin';

    logger.debug('HOD verification for user:', req.user.id);

    if (isHod || isActingHod || isAdmin) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "HOD privileges required"
        });
    }
};

/**
 * Maintenance Mode Guard
 * Checks `maintenance_mode` setting and blocks non-admin users with 503.
 * Runs after verifyToken so req.userRole is available.
 */
const maintenanceGuard = (req, res, next) => {
    // Skip check for auth routes (login/logout) and health checks
    if (req.path.startsWith('/api/v1/auth') || req.path.startsWith('/api/v1/health')) {
        return next();
    }

    // If user is admin, always allow through
    if (req.userRole === 'admin') {
        return next();
    }

    const { getDB } = require('../config/db');
    const db = getDB();

    db.get("SELECT value FROM settings WHERE key = 'maintenance_mode'", [], (err, row) => {
        if (err) {
            logger.error('Maintenance check failed:', err);
            return next(); // fail-open: don't block if the DB query fails
        }
        if (row && row.value === 'true') {
            return res.status(503).json({
                success: false,
                message: 'The system is currently under maintenance. Please try again later.'
            });
        }
        next();
    });
};

module.exports = { verifyToken, verifyAdmin, verifyHod, maintenanceGuard };
