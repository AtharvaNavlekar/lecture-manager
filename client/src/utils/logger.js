class ClientLogger {
    constructor() {
        this.isDevelopment = import.meta.env.DEV;
        this.isProduction = import.meta.env.PROD;
        this.moduleName = null;
    }

    _shouldLog(level) {
        if (this.isProduction && level !== 'error') {
            return false;
        }
        return true;
    }

    _formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
        const module = this.moduleName ? `[${this.moduleName}]` : '';
        return [`[${timestamp}] [${level.toUpperCase()}] ${module}:`, message, ...args];
    }

    _log(level, message, ...args) {
        if (!this._shouldLog(level)) {
            return;
        }

        const formatted = this._formatMessage(level, message, ...args);

        if (this.isDevelopment) {
            console[level === 'debug' ? 'log' : level](...formatted);
        } else if (this.isProduction && level === 'error') {
            // In production, only log errors
            // TODO: Send to error tracking service (Sentry, etc.)
            this._sendToErrorTracking(message, args);
        }
    }

    _sendToErrorTracking(message, args) {
        // Placeholder for error tracking integration
        // In production, this would send to Sentry or similar service
        console.error('PRODUCTION ERROR:', message, args);
    }

    debug(message, ...args) {
        this._log('debug', message, ...args);
    }

    info(message, ...args) {
        this._log('info', message, ...args);
    }

    warn(message, ...args) {
        this._log('warn', message, ...args);
    }

    error(message, ...args) {
        this._log('error', message, ...args);
    }

    // Create a child logger for a specific module
    module(moduleName) {
        const childLogger = new ClientLogger();
        childLogger.moduleName = moduleName;
        return childLogger;
    }
}

const logger = new ClientLogger();
export default logger;
