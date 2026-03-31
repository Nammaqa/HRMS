/**
 * Morning Reminder Cron Entry Point
 * Calls /api/morning-reminder every day at 10:00 AM
 */

require('dotenv').config();

const cron = require('node-cron');
const http = require('http');
const https = require('https');

const TIMEZONE = 'Asia/Kolkata';
const API_URL = `${process.env.API_URL}/api/mail/morning-reminder`;

console.log('[CRON] Morning Reminder Worker Started');

// Schedule morning reminder: 9:30 AM, Monday-Friday
const morningTask = cron.schedule(
  '30 9 * * 1-5',
  async () => {
    console.log('[CRON] Executing Morning Reminder API call at', new Date().toISOString());
    try {
      const result = await callMorningReminderAPI();
      console.log('[CRON] Morning Reminder API call completed:', result);
    } catch (error) {
      console.error('[CRON] Morning Reminder API call failed:', error.message);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

async function callMorningReminderAPI() {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}/api/morning-reminder`;
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
  console.log('[CRON] Morning Reminder Worker shutting down gracefully');
  morningTask.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[CRON] Morning Reminder Worker interrupted');
  morningTask.stop();
  process.exit(0);
});
