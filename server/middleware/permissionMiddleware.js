const { db } = require('../config/db');

/**
 * RBAC (Role-Based Access Control) Middleware
 * Provides fine-grained permission checking
 */

// Permission cache (in-memory)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get user permissions (with caching)
const getUserPermissions = (userId, userRole) => {
    const cacheKey = `user_${userId}`;
    const cached = permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.permissions;
    }

    try {
        // Get permissions from role
        const rolePermissions = db.prepare(`
            SELECT p.name
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON r.id = rp.role_id
            WHERE r.name = ?
        `).all(userRole);

        const permissions = rolePermissions.map(p => p.name);

        // Cache permissions
        permissionCache.set(cacheKey, {
            permissions,
            timestamp: Date.now()
        });

        return permissions;
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
};

// Clear permission cache for a user
const clearPermissionCache = (userId) => {
    permissionCache.delete(`user_${userId}`);
};

// Middleware to check if user has required permission
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        const userId = req.userId;
        const userRole = req.userRole;

        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admin has all permissions
        if (userRole === 'admin') {
            return next();
        }

        const userPermissions = getUserPermissions(userId, userRole);

        if (userPermissions.includes(requiredPermission)) {
            return next();
        }

        console.log(`🔒 Permission denied: ${userRole} tried to ${requiredPermission}`);

        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            required_permission: requiredPermission
        });
    };
};

// Middleware to check if user has ANY of the required permissions
const checkAnyPermission = (...requiredPermissions) => {
    return (req, res, next) => {
        const userId = req.userId;
        const userRole = req.userRole;

        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admin has all permissions
        if (userRole === 'admin') {
            return next();
        }

        const userPermissions = getUserPermissions(userId, userRole);
        const hasPermission = requiredPermissions.some(perm =>
            userPermissions.includes(perm)
        );

        if (hasPermission) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            required_permissions: requiredPermissions
        });
    };
};

// Middleware to check if user has ALL required permissions
const checkAllPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        const userId = req.userId;
        const userRole = req.userRole;

        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admin has all permissions
        if (userRole === 'admin') {
            return next();
        }

        const userPermissions = getUserPermissions(userId, userRole);
        const hasAllPermissions = requiredPermissions.every(perm =>
            userPermissions.includes(perm)
        );

        if (hasAllPermissions) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            required_permissions: requiredPermissions
        });
    };
};

// Resource ownership check
const checkResourceOwnership = (resourceType) => {
    return (req, res, next) => {
        const userId = req.userId;
        const userRole = req.userRole;
        const resourceId = req.params.id;

        // Admin bypass
        if (userRole === 'admin') {
            return next();
        }

        try {
            let query;
            let params = [resourceId];

            switch (resourceType) {
                case 'lecture':
                    // Check if user is the scheduled or substitute teacher
                    query = `
                        SELECT id FROM lectures
                        WHERE id = ? AND (scheduled_teacher_id = ? OR substitute_teacher_id = ?)
                    `;
                    params = [resourceId, userId, userId];
                    break;

                case 'leave_request':
                    // Check if user created the leave request
                    query = 'SELECT id FROM leave_requests WHERE id = ? AND teacher_id = ?';
                    params = [resourceId, userId];
                    break;

                case 'resource':
                    // Check if user uploaded the resource
                    query = 'SELECT id FROM resources WHERE id = ? AND teacher_id = ?';
                    params = [resourceId, userId];
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid resource type'
                    });
            }

            const resource = db.prepare(query).get(...params);

            if (!resource) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You do not own this resource'
                });
            }

            next();

        } catch (error) {
            console.error('Resource ownership check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking resource ownership'
            });
        }
    };
};

// Department scope check
const checkDepartmentScope = (req, res, next) => {
    const userId = req.userId;
    const userRole = req.userRole;
    const userDepartment = req.userDepartment;

    //Admin bypasses department restrictions
    if (userRole === 'admin') {
        return next();
    }

    // Attach department filter to request
    req.departmentScope = userDepartment;
    next();
};

module.exports = {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkResourceOwnership,
    checkDepartmentScope,
    getUserPermissions,
    clearPermissionCache
};
