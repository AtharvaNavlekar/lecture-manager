module.exports = {
  apps: [{
    name: 'lecture-manager-api',
    script: './server/index.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'debug'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      LOG_LEVEL: 'info'
    },
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    max_memory_restart: '500M',
    error_file: './server/logs/pm2-error.log',
    out_file: './server/logs/pm2-out.log',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    // Graceful shutdown
    shutdown_with_message: true,
    // Health check
    health_check: {
      type: 'http',
      url: 'http://localhost:3000/api/health',
      interval: 30000
    }
  }]
};
