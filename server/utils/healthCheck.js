const net = require('net');
const logger = require('./logger');

/**
 * Perform comprehensive health checks before server startup
 */
async function performHealthChecks() {
    const checks = {
        port: false,
        database: false,
        essentialServices: false
    };

    try {
        // Check if port is available
        const port = process.env.PORT || 3000;
        checks.port = await isPortAvailable(port);

        if (!checks.port) {
            logger.error(`Port ${port} is already in use. Please free the port or use a different one.`);
            throw new Error(`Port ${port} is not available`);
        }

        // Check database connection
        checks.database = await isDatabaseHealthy();

        if (!checks.database) {
            logger.error('Database connection check failed');
            throw new Error('Database is not healthy');
        }

        // Check essential services (if any)
        checks.essentialServices = true; // Placeholder for future service checks

        logger.info('✅ All health checks passed', checks);
        return checks;
    } catch (error) {
        logger.error('❌ Health check failed', { error: error.message, checks });
        throw error;
    }
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    resolve(false);
                }
            })
            .once('listening', () => {
                tester.close();
                resolve(true);
            })
            .listen(port);
    });
}

/**
 * Check database health
 */
async function isDatabaseHealthy() {
    try {
        const { db } = require('../config/db');

        return new Promise((resolve) => {
            db.get('SELECT 1 as test', (err) => {
                if (err) {
                    logger.error('Database health check failed:', err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    } catch (error) {
        logger.error('Database connection error:', error);
        return false;
    }
}

/**
 * Create health check endpoint handler
 */
function createHealthEndpoint() {
    return async (req, res) => {
        try {
            const dbHealthy = await isDatabaseHealthy();

            const health = {
                status: dbHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: dbHealthy ? 'connected' : 'disconnected',
                memory: process.memoryUsage(),
                nodeVersion: process.version
            };

            const statusCode = dbHealthy ? 200 : 503;
            res.status(statusCode).json(health);
        } catch (error) {
            logger.error('Health check endpoint error:', error);
            res.status(503).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    };
}

module.exports = {
    performHealthChecks,
    isPortAvailable,
    isDatabaseHealthy,
    createHealthEndpoint
};
