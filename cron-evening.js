/**
 * Evening Reminder Cron Entry Point
 * Calls /api/mail/evening-reminder every day at 9:00 PM
 */

require('dotenv').config();

const cron = require('node-cron');
const http = require('http');
const https = require('https');

const TIMEZONE = 'Asia/Kolkata';
const API_URL = `${process.env.API_URL}/api/mail/evening-reminder`;

console.log('[CRON] Evening Reminder Worker Started');

// Schedule evening reminder: 9:00 PM, Monday-Friday
const eveningTask = cron.schedule(
  '0 21 * * 1-5',
  async () => {
    console.log('[CRON] Executing Evening Reminder API call at', new Date().toISOString());
    try {
      const result = await callEveningReminderAPI();
      console.log('[CRON] Evening Reminder API call completed:', result);
    } catch (error) {
      console.error('[CRON] Evening Reminder API call failed:', error.message);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

async function callEveningReminderAPI() {
  return new Promise((resolve, reject) => {
    const url = API_URL;
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
  console.log('[CRON] Evening Reminder Worker shutting down gracefully');
  eveningTask.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[CRON] Evening Reminder Worker interrupted');
  eveningTask.stop();
  process.exit(0);
});
