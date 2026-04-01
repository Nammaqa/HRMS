/**
 * Auto Logout Cron Entry Point
 * Calls /api/mail/auto-logout every day at 11:59 PM
 */

require('dotenv').config();

const cron = require('node-cron');
const http = require('http');
const https = require('https');

const TIMEZONE = 'Asia/Kolkata';
const API_URL = process.env.API_URL || 'https://hrms.wizzybox.in';

console.log('[CRON] Auto Logout Worker Started');

// Schedule auto logout: 11:59 PM, every day
const autoLogoutTask = cron.schedule(
  '59 23 * * *',
  async () => {
    console.log('[CRON] Executing Auto Logout API call at', new Date().toISOString());
    try {
      const result = await callAutoLogoutAPI();
      console.log('[CRON] Auto Logout API call completed:', result);
    } catch (error) {
      console.error('[CRON] Auto Logout API call failed:', error.message);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

async function callAutoLogoutAPI() {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}/api/mail/auto-logout`;
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[CRON] Auto Logout Worker shutting down gracefully');
  autoLogoutTask.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[CRON] Auto Logout Worker interrupted');
  autoLogoutTask.stop();
  process.exit(0);
});
