const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Centralized error handling middleware
 * This should be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
    // Log the error
    logger.error('Error occurred:', {
        error: err.message,
        code: err.code || 'UNKNOWN',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    // Handle ApiError instances
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // Handle validation errors from express-validator or similar
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: err.details || err.errors,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_TOKEN_INVALID',
                message: 'Invalid token',
                timestamp: new Date().toISOString()
            }
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_TOKEN_EXPIRED',
                message: 'Token expired',
                timestamp: new Date().toISOString()
            }
        });
    }

    // Handle database errors
    if (err.code && err.code.startsWith('SQLITE_')) {
        const statusCode = err.code === 'SQLITE_CONSTRAINT' ? 409 : 500;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: 'DB_ERROR',
                message: process.env.NODE_ENV === 'production'
                    ? 'Database operation failed'
                    : err.message,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Handle all other errors
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'RESOURCE_NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};
