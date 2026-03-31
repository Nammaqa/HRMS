/**
 * Earned Leave Accrual Cron Entry Point
 * Calls /api/mail/add-earned-leave on 1st of every month at 6:00 AM
 */

require('dotenv').config();

const cron = require('node-cron');
const http = require('http');
const https = require('https');

const TIMEZONE = 'Asia/Kolkata';
const API_URL = `${process.env.API_URL}/api/mail/add-earned-leave`;

console.log('[CRON] Earned Leave Accrual Worker Started');

// Schedule earned leave accrual: 6:00 AM, 1st of every month
const earnedLeaveTask = cron.schedule(
  '0 6 1 * *',
  async () => {
    console.log('[CRON] Executing Earned Leave Accrual API call at', new Date().toISOString());
    try {
      const result = await callEarnedLeaveAPI();
      console.log('[CRON] Earned Leave Accrual API call completed:', result);
    } catch (error) {
      console.error('[CRON] Earned Leave Accrual API call failed:', error.message);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

async function callEarnedLeaveAPI() {
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
  console.log('[CRON] Earned Leave Accrual Worker shutting down gracefully');
  earnedLeaveTask.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[CRON] Earned Leave Accrual Worker interrupted');
  earnedLeaveTask.stop();
  process.exit(0);
});
