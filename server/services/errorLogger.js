const fs = require('fs');
const path = require('path');

class ErrorLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.errorLogPath = path.join(this.logDir, 'errors.log');
        this.metricsLogPath = path.join(this.logDir, 'metrics.log');

        // Create logs directory if doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    logError(error, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'ERROR',
            message: error.message,
            stack: error.stack,
            context,
            severity: this.calculateSeverity(error, context)
        };

        // Write to file
        fs.appendFileSync(
            this.errorLogPath,
            JSON.stringify(logEntry) + '\n',
            'utf8'
        );

        // Console log with color
        console.error(`\x1b[31m[ERROR ${timestamp}]\x1b[0m`, error.message);
        if (context.critical) {
            console.error('\x1b[41m CRITICAL ERROR \x1b[0m');
        }

        return logEntry;
    }

    logMetric(metric, value, tags = {}) {
        const timestamp = new Date().toISOString();
        const metricEntry = {
            timestamp,
            metric,
            value,
            tags
        };

        fs.appendFileSync(
            this.metricsLogPath,
            JSON.stringify(metricEntry) + '\n',
            'utf8'
        );
    }

    calculateSeverity(error, context) {
        if (context.critical) return 'CRITICAL';
        if (error.message.includes('database')) return 'HIGH';
        if (error.message.includes('timeout')) return 'MEDIUM';
        return 'LOW';
    }

    getRecentErrors(limit = 100) {
        try {
            const content = fs.readFileSync(this.errorLogPath, 'utf8');
            const lines = content.trim().split('\n');
            return lines
                .slice(-limit)
                .map(line => JSON.parse(line))
                .reverse();
        } catch (err) {
            return [];
        }
    }

    getErrorStats() {
        const errors = this.getRecentErrors(1000);
        const stats = {
            total: errors.length,
            bySeverity: {},
            byHour: {},
            topErrors: {}
        };

        errors.forEach(error => {
            // By severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

            // By hour
            const hour = new Date(error.timestamp).getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

            // Top error messages
            const msg = error.message.substring(0, 50);
            stats.topErrors[msg] = (stats.topErrors[msg] || 0) + 1;
        });

        return stats;
    }

    clearOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        try {
            const content = fs.readFileSync(this.errorLogPath, 'utf8');
            const lines = content.trim().split('\n');

            const recentLines = lines.filter(line => {
                try {
                    const entry = JSON.parse(line);
                    return new Date(entry.timestamp) > cutoffDate;
                } catch {
                    return false;
                }
            });

            fs.writeFileSync(this.errorLogPath, recentLines.join('\n') + '\n', 'utf8');
            console.log(`✅ Cleaned logs, kept ${recentLines.length} entries`);
        } catch (err) {
            console.error('Failed to clean logs:', err);
        }
    }
}

// Singleton instance
const errorLogger = new ErrorLogger();

// Express middleware
function errorLoggingMiddleware(err, req, res, next) {
    errorLogger.logError(err, {
        url: req.url,
        method: req.method,
        user: req.user?.id,
        critical: res.statusCode >= 500
    });

    next(err);
}

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    errorLogger.logError(error, { critical: true, source: 'uncaughtException' });
    console.error('Uncaught Exception:', error);
    // Don't exit - let PM2/supervisor handle it
});

process.on('unhandledRejection', (reason, promise) => {
    errorLogger.logError(new Error(String(reason)), {
        critical: true,
        source: 'unhandledRejection'
    });
});

module.exports = {
    errorLogger,
    errorLoggingMiddleware
};
