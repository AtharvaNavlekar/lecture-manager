const winston = require('winston');
const path = require('path');

// Custom format for development (colorized, readable)
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, module, ...metadata }) => {
        let msg = `${timestamp} [${level}]`;
        if (module) msg += ` [${module}]`;
        msg += `: ${message}`;

        const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
        return msg + metaStr;
    })
);

// Production format (JSON for log aggregation)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    defaultMeta: { service: 'lecture-manager-api' },
    transports: [
        // Error log - only errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        // Combined log - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    ],
    // Don't exit on uncaught errors
    exitOnError: false
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: devFormat,
        level: 'debug'
    }));
}

// Create child loggers for different modules
logger.createModuleLogger = (moduleName) => {
    return logger.child({ module: moduleName });
};

// Helper methods
logger.logRequest = (req, res, duration) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
    });
};

logger.logError = (error, context = {}) => {
    logger.error(error.message, {
        stack: error.stack,
        ...context
    });
};

module.exports = logger;
