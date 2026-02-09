const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];

    // Check query param (for SSE)
    if (!token && req.query.token) {
        token = 'Bearer ' + req.query.token;
    }

    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided.' });
    }

    // Expecting format: "Bearer <token>"
    const bearer = token.split(' ');
    const tokenValue = bearer[1];

    if (!tokenValue) {
        return res.status(403).json({ success: false, message: 'Malformed token.' });
    }

    jwt.verify(tokenValue, process.env.JWT_SECRET || 'secret_key_123', (err, decoded) => {
        if (err) {
            console.error('❌ JWT Verification failed:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to authenticate token.' });
        }

        console.log('✅ JWT verified for user ID:', decoded.id);

        const { getDB } = require('../config/db');
        const db = getDB();

        db.get("SELECT id, name, email, department, is_hod, is_acting_hod, post FROM teachers WHERE id = ?", [decoded.id], (err, user) => {
            if (err) {
                console.error('❌ Database error during user lookup:', err);
                return res.status(401).json({ success: false, message: 'Database error during authentication.' });
            }

            if (!user) {
                console.error('❌ User not found in database. ID:', decoded.id);
                return res.status(401).json({ success: false, message: 'User no longer exists or access revoked.' });
            }

            console.log('✅ User found:', user.name, '(ID:', user.id, ')');

            // Determine role dynamically based on DB state, not just token
            let role = 'teacher';
            if (user.department === 'Administration' || user.department === 'Admin') {
                role = 'admin';
            } else if (user.is_hod === 1 || user.is_acting_hod === 1) {
                role = 'hod';
            }

            req.userId = user.id;
            req.userRole = role; // Source of truth
            req.userDept = user.department;
            req.user = user; // Full user object for controllers
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
        console.error('❌ verifyHod: No user data found. verifyToken must be called first.');
        return res.status(500).json({ success: false, message: "Authentication required" });
    }

    // Check HOD privileges from already-loaded user object
    const isHod = req.user.is_hod === 1;
    const isActingHod = req.user.is_acting_hod === 1;
    const isAdmin = req.userRole === 'admin';

    console.log('✅ HOD verification:', {
        userId: req.user.id,
        userName: req.user.name,
        isHod,
        isActingHod,
        isAdmin,
        hasPrivileges: isHod || isActingHod || isAdmin
    });

    if (isHod || isActingHod || isAdmin) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "HOD privileges required"
        });
    }
};

module.exports = { verifyToken, verifyAdmin, verifyHod };
