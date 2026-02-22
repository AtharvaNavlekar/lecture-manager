require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { db, initDB } = require('./config/db');

// NEW: Utilities for permanent solutions
const logger = require('./utils/logger');
const { performHealthChecks, createHealthEndpoint } = require('./utils/healthCheck');
const gracefulShutdown = require('./utils/gracefulShutdown');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Security
const helmet = require('helmet');

// Routes
const authRoutes = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const hodRoutes = require('./routes/hodRoutes');
const studentRoutes = require('./routes/studentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const searchRoutes = require('./routes/searchRoutes');
const configRoutes = require('./routes/configRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For React dev
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // For dev
}));

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Main startup function
async function startServer() {
  try {
    // Security validations before starting
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.JWT_SECRET || '';
      if (secret.length < 32 || secret === 'your-secret-key-change-in-production') {
        throw new Error('FATAL: JWT_SECRET is missing or too weak. Set a strong secret.');
      }

      const adminUser = await new Promise((resolve, reject) => {
        db.get("SELECT password FROM teachers WHERE email = 'admin@college.edu'", [], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (adminUser) {
        const bcrypt = require('bcrypt');
        const isDefault = await bcrypt.compare('admin123', adminUser.password);
        if (isDefault) throw new Error('FATAL: Default admin password not changed. Refusing to start.');
      }
    }

    // Step 1: Perform health checks
    logger.info('🔍 Performing startup health checks...');
    await performHealthChecks();

    // Step 2: Initialize database
    logger.info('📦 Initializing database...');
    initDB();

    // Step 3: TODO: Run database migrations (after packages are installed)
    // const migrationService = require('./services/migrationService');
    // await migrationService.runPendingMigrations();

    // Step 4: Start Automation Service
    const automationService = require('./services/automationService');
    automationService.start();
    logger.info('🤖 Automation timers activated');

    // Step 5: Setup Error Logging
    const { errorLogger, errorLoggingMiddleware } = require('./services/errorLogger');
    logger.info('📊 Legacy error logging enabled');

    // Health check endpoint
    app.get('/api/v1/health', createHealthEndpoint());

    // API Routes
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/auth', passwordResetRoutes);
    app.use('/api/v1/teachers', teacherRoutes);
    app.use('/api/v1/lectures', lectureRoutes);
    app.use('/api/v1/hod', hodRoutes);
    app.use('/api/v1/students', studentRoutes);
    app.use('/api/v1/subjects', require('./routes/subjectRoutes'));
    app.use('/api/v1/admin', require('./routes/adminRoutes'));
    app.use('/api/v1/admin', require('./routes/dataManagementRoutes'));
    app.use('/api/v1/settings', require('./routes/settingsRoutes'));
    app.use('/api/v1/ai', require('./routes/aiRoutes'));
    app.use('/api/v1/leaves', require('./routes/leaveRoutes'));
    app.use('/api/v1/assignments', require('./routes/assignmentRoutes'));
    app.use('/api/v1/announcements', require('./routes/announcementRoutes'));
    app.use('/api/v1/resources', require('./routes/resourceRoutes'));
    app.use('/api/v1/substitutes', require('./routes/substituteRoutes'));
    app.use('/api/v1/evaluations', require('./routes/evaluationRoutes'));
    app.use('/api/v1/search', require('./routes/searchRoutes'));
    app.use('/api/v1/audit', require('./routes/auditRoutes'));
    app.use('/api/v1/reports', require('./routes/reportRoutes'));
    app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
    app.use('/api/v1/calendar', require('./routes/calendarRoutes'));
    app.use('/api/v1/files', require('./routes/fileRoutes'));
    app.use('/api/v1/config', configRoutes);
    app.use('/api/v1/automation', require('./routes/automationRoutes'));
    app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));

    // Legacy route support
    app.use('/api', lectureRoutes);

    // 404 handler (must be before error handler)
    app.use(notFoundHandler);

    // Centralized error handling middleware (must be last)
    app.use(errorHandler);

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Enterprise Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);

      // Signal to PM2 that app is ready
      if (process.send) {
        process.send('ready');
        logger.info('✅ PM2 ready signal sent');
      }
    });

    // Setup graceful shutdown
    gracefulShutdown
      .registerServer(server)
      .registerDatabase(db)
      .registerAutomationService(automationService)
      .setupHandlers();

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
