const logger = require('./logger');

/**
 * Graceful shutdown handler for PM2 and manual shutdowns
 */
class GracefulShutdown {
    constructor() {
        this.isShuttingDown = false;
        this.shutdownTimeout = 10000; // 10 seconds max
        this.server = null;
        this.db = null;
        this.automationService = null;
    }

    /**
     * Register the HTTP server
     */
    registerServer(server) {
        this.server = server;
        return this;
    }

    /**
     * Register database connection
     */
    registerDatabase(db) {
        this.db = db;
        return this;
    }

    /**
     * Register automation service
     */
    registerAutomationService(service) {
        this.automationService = service;
        return this;
    }

    /**
     * Perform graceful shutdown
     */
    async shutdown(signal = 'SIGTERM') {
        if (this.isShuttingDown) {
            logger.warn('Shutdown already in progress...');
            return;
        }

        this.isShuttingDown = true;
        logger.info(`\n${signal} received. Starting graceful shutdown...`);

        // Set timeout for forceful shutdown
        const forceShutdownTimer = setTimeout(() => {
            logger.error('⚠️  Graceful shutdown timeout. Forcing shutdown...');
            process.exit(1);
        }, this.shutdownTimeout);

        try {
            // Step 1: Stop accepting new connections
            if (this.server) {
                await new Promise((resolve, reject) => {
                    this.server.close((err) => {
                        if (err) {
                            logger.error('Error closing HTTP server:', err);
                            reject(err);
                        } else {
                            logger.info('✅ HTTP server closed');
                            resolve();
                        }
                    });
                });
            }

            // Step 2: Stop automation services
            if (this.automationService && typeof this.automationService.stop === 'function') {
                try {
                    await this.automationService.stop();
                    logger.info('✅ Automation service stopped');
                } catch (error) {
                    logger.error('Error stopping automation service:', error);
                }
            }

            // Step 3: Close database connections
            if (this.db) {
                await new Promise((resolve, reject) => {
                    this.db.close((err) => {
                        if (err) {
                            logger.error('Error closing database:', err);
                            reject(err);
                        } else {
                            logger.info('✅ Database connection closed');
                            resolve();
                        }
                    });
                });
            }

            // Clear the force shutdown timer
            clearTimeout(forceShutdownTimer);

            logger.info('✅ Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Error during graceful shutdown:', error);
            clearTimeout(forceShutdownTimer);
            process.exit(1);
        }
    }

    /**
     * Setup signal handlers
     */
    setupHandlers() {
        // Handle termination signals
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGHUP', () => this.shutdown('SIGHUP'));

        // PM2 specific
        process.on('message', (msg) => {
            if (msg === 'shutdown') {
                this.shutdown('PM2 SHUTDOWN');
            }
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            this.shutdown('UNCAUGHT_EXCEPTION');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.shutdown('UNHANDLED_REJECTION');
        });

        logger.info('✅ Graceful shutdown handlers registered');
        return this;
    }
}

module.exports = new GracefulShutdown();
