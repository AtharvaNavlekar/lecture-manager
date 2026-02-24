const { ErrorStatusCodes } = require('../constants/errorCodes');

/**
 * Custom API Error class with structured error information
 */
class ApiError extends Error {
    constructor(code, message, details = null, statusCode = null) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
        this.statusCode = statusCode || ErrorStatusCodes[code] || 500;
        this.isOperational = true; // Distinguish from programming errors
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert to JSON response format
     */
    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Static factory methods for common errors
     */
    static badRequest(message, details = null) {
        return new ApiError('VALIDATION_ERROR', message, details, 400);
    }

    static unauthorized(message = 'Unauthorized') {
        return new ApiError('AUTH_UNAUTHORIZED', message, null, 401);
    }

    static forbidden(message = 'Forbidden') {
        return new ApiError('AUTH_FORBIDDEN', message, null, 403);
    }

    static notFound(resource = 'Resource') {
        return new ApiError('RESOURCE_NOT_FOUND', `${resource} not found`, null, 404);
    }

    static conflict(message, details = null) {
        return new ApiError('RESOURCE_ALREADY_EXISTS', message, details, 409);
    }

    static internal(message = 'Internal server error') {
        return new ApiError('INTERNAL_SERVER_ERROR', message, null, 500);
    }
}

module.exports = ApiError;
