import logger from '@/utils/logger';

// Centralized Error Handling & Logging Service
class ErrorService {
    constructor() {
        this.isDevelopment = import.meta.env.DEV;
        this.errorCallbacks = [];
    }

    // Register error callback (e.g., for toast notifications)
    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    // Handle API errors
    handleApiError(error, context = '') {
        const message = this.extractErrorMessage(error);
        const severity = this.determineSeverity(error);

        // Log to console in development
        if (this.isDevelopment) {
            logger.error(`[${context}] API Error:`, {
                message,
                severity,
                error
            });
        }

        // Trigger registered callbacks (e.g., show toast)
        this.errorCallbacks.forEach(callback => {
            callback({ message, severity, context });
        });

        return message;
    }

    // Extract user-friendly error message
    extractErrorMessage(error) {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred. Please try again.';
    }

    // Determine error severity
    determineSeverity(error) {
        const status = error.response?.status;
        if (status >= 500) return 'error';
        if (status === 404) return 'warning';
        if (status === 403 || status === 401) return 'warning';
        return 'error';
    }

    // Log info message
    logInfo(message, data = {}) {
        if (this.isDevelopment) {
            logger.debug(`[INFO] ${message}`, data);
        }
    }

    // Log warning
    logWarning(message, data = {}) {
        if (this.isDevelopment) {
            logger.warn(`[WARN] ${message}`, data);
        }
    }
}

export const errorService = new ErrorService();
export default errorService;
