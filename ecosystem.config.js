/**
 * PM2 Ecosystem Configuration
 * Manages 2 cron jobs for HRMS application
 * 
 * Usage:
 * - Start all crons: pm2 start ecosystem.config.js
 * - Stop all crons: pm2 stop ecosystem
 * - Restart all crons: pm2 restart ecosystem
 * - View logs: pm2 logs
 * - Delete all: pm2 delete ecosystem
 */

module.exports = {
  apps: [
    {
      name: 'hrms-cron-morning',
      script: './cron-morning.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/cron-morning-error.log',
      out_file: './logs/cron-morning-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'hrms-cron-earned-leave',
      script: './cron-earned-leave.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/cron-earned-leave-error.log',
      out_file: './logs/cron-earned-leave-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'hrms-cron-evening',
      script: './cron-evening.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/cron-evening-error.log',
      out_file: './logs/cron-evening-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'hrms-cron-autologout',
      script: './cron-autologout.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/cron-autologout-error.log',
      out_file: './logs/cron-autologout-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
