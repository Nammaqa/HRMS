# Cron Jobs Monitoring Guide

Complete step-by-step guide to check, monitor, and manage cron jobs in the Attendance System.

---

## Table of Contents
1. [Overview](#overview)
2. [Cron Jobs Setup](#cron-jobs-setup)
3. [How to Check Cron Jobs Status](#how-to-check-cron-jobs-status)
4. [Understanding Execution Logs](#understanding-execution-logs)
5. [Monitoring in Production (Vercel)](#monitoring-in-production-vercel)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The system has **4 scheduled cron jobs** that run automatically:

| Job Name | Schedule | Timezone | Purpose |
|----------|----------|----------|---------|
| **MORNING_REMINDER** | 9:30 AM | IST (Asia/Kolkata) | Sends work reminders to employees |
| **EVENING_REMINDER** | 8:30 PM | IST (Asia/Kolkata) | Sends checkout reminders |
| **AUTO_LOGOUT** | 11:59 PM | IST (Asia/Kolkata) | Auto-logs out employees |
| **EARNED_LEAVE_ACCRUAL** | 12:00 AM (1st of month) | IST (Asia/Kolkata) | Accrues earned leaves monthly |

---

## Cron Jobs Setup

### Location of Cron Configuration
```
src/cron/
├── nodeCron.ts           # Main cron scheduler (for Node.js environment)
├── executor.ts           # Executes cron logic
└── logic/
    ├── morning.ts        # Morning reminder logic
    ├── evening.ts        # Evening reminder logic
    ├── autoLogout.ts     # Auto logout logic
    └── earnedLeave.ts    # Earned leave accrual logic
```

### Cron Execution Modes

The system supports **two execution modes**:

1. **Node-Cron Mode** (Production/Local)
   - Uses `node-cron` package
   - Runs directly in the Node.js process
   - Enabled when: `CRON_MODE=node`

2. **API Route Mode** (Fallback)
   - Uses Next.js API routes
   - Can be triggered manually via API calls
   - Routes: `/api/cron/morning-reminder`, `/api/cron/evening-reminder`, etc.

---

## How to Check Cron Jobs Status

### Method 1: Via Status API Endpoint (Easiest)

#### Step 1: Open the Cron Status Dashboard
```
http://localhost:3000/api/cron/status
```
OR
```
https://your-production-url.vercel.app/api/cron/status
```

#### Step 2: View the Response
You'll see a JSON response with:
- **Status of each cron job**
- **Recent execution history** (last 50 executions)
- **7-day statistics** by cron name and status

#### Example Response:
```json
{
  "cronStatus": {
    "isInitialized": true,
    "activeCrons": 4,
    "cronJobs": [
      {
        "name": "MORNING_REMINDER",
        "status": "SUCCESS",
        "nextRun": "2026-02-13T04:00:00.000Z",
        "pattern": "30 9 * * 1-5"
      }
    ]
  },
  "recentExecutions": [
    {
      "id": 1,
      "cronName": "MORNING_REMINDER",
      "status": "SUCCESS",
      "startedAt": "2026-02-12T10:08:41.076Z",
      "finishedAt": "2026-02-12T10:08:41.044Z",
      "totalUsers": 3,
      "successCount": 3,
      "skippedCount": 0,
      "failedCount": 0,
      "message": "Total: 3, Success: 3, Skipped: 0, Failed: 0"
    }
  ],
  "stats": [
    {
      "cronName": "MORNING_REMINDER",
      "status": "SUCCESS",
      "count": 1
    }
  ]
}
```

---

### Method 2: Check Database Directly

#### Step 1: Access Database
Use Prisma Studio:
```bash
npx prisma studio
```

#### Step 2: Navigate to CronExecution Table
1. Click on **CronExecution** model
2. View all recorded cron executions

#### Step 3: Analyze the Data
Each record shows:
- `cronName` - Name of the cron job
- `status` - SUCCESS or FAILED
- `startedAt` - When execution started
- `finishedAt` - When execution finished
- `totalUsers` - Total users processed
- `successCount` - Successfully processed
- `skippedCount` - Skipped (already processed)
- `failedCount` - Failed to process
- `message` - Summary message

---

### Method 3: Check Logs in Local Development

#### Step 1: Run Development Server
```bash
npm run dev
```

#### Step 2: Check Console Output
Watch the terminal for cron logs:
```
[CRON] ✓ Scheduled MORNING_REMINDER
[CRON] ✓ Scheduled EVENING_REMINDER
[CRON] ✓ Scheduled AUTO_LOGOUT
[CRON] ✓ Scheduled EARNED_LEAVE_ACCRUAL

[CRON] Executing MORNING_REMINDER from Node-Cron
[CRON] MORNING_REMINDER execution completed successfully
```

#### Step 3: Monitor Real-time Logs
The console will show:
- ✅ Cron initialization
- ⏰ Execution start/end times
- 📊 Statistics (total users, success, failed, skipped)
- ⚠️ Any errors encountered

---

### Method 4: Check Vercel Deployment Logs

#### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Select your project (`wizzybox-attendance`)

#### Step 2: View Function Logs
1. Click **Deployments**
2. Select the latest deployment
3. Click **Functions** tab
4. Look for `/api/cron/*` logs

#### Step 3: Monitor Real-time Execution
1. Go to **Monitoring** tab
2. View live logs as crons execute
3. Check timestamps to verify execution timing

---

## Understanding Execution Logs

### Status Meanings

#### ✅ SUCCESS
- Cron executed successfully
- All eligible users were processed
- Example: `"Total: 3, Success: 3, Skipped: 0, Failed: 0"`

#### ⏭️ FAILED (with all Skipped)
- Cron ran but all users were skipped
- **This is normal for earned leave accrual**
- Happens when accrual already done in current month
- Not actually a failure — it's preventing duplicate accrual

#### ❌ FAILED (with Failed count > 0)
- Actual errors occurred during processing
- Check error messages and database connections
- May need investigation

#### ⏸️ SKIPPED
- User was skipped for specific reasons:
  - **Morning/Evening Reminder**: Already sent today
  - **Auto Logout**: Employee already logged out
  - **Earned Leave**: Already accrued this month

---

## Monitoring in Production (Vercel)

### Step 1: Enable Production Monitoring

#### Environment Variables needed:
```env
CRON_MODE=node
IS_CRON_MASTER=true
NEXT_PUBLIC_CRON_ENABLED=true
```

#### Set in Vercel:
1. Go to Vercel Dashboard
2. Project > Settings > Environment Variables
3. Add the above variables

### Step 2: Monitor Live Executions

#### Check Status API:
```bash
# Production URL
curl https://your-app.vercel.app/api/cron/status
```

#### View in Browser:
```
https://your-app.vercel.app/api/cron/status
```

### Step 3: Set Up Alerts

#### Option A: Database Monitoring
Monitor `CronExecution` table for failures:
```sql
SELECT * FROM "CronExecution" 
WHERE status = 'FAILED' 
AND "failedCount" > 0
ORDER BY "createdAt" DESC
LIMIT 10;
```

#### Option B: Custom Alerts
Add webhook notifications when cron fails (optional):
- Check `failedCount > 0`
- Send alert to Slack/Email
- Log to external monitoring service

---

## Troubleshooting

### Issue 1: Earned Leave Accrual Shows "FAILED"

**Symptoms:**
- Status: FAILED
- successCount: 0
- skippedCount: 8

**Cause:**
All users were already accrued this month (expected behavior)

**Solution:**
✅ This is **NOT an error**. The cron is working correctly by preventing duplicate accrual in the same month.

**Verification:**
1. Check `LeaveBalance.lastAccrualDate` in database
2. Should show a date in February 2026
3. Next accrual will run on March 1st, 2026

---

### Issue 2: Cron Jobs Not Running

**Symptoms:**
- No logs in console
- API returns empty execution history

**Causes & Solutions:**

#### Check 1: Is Node.js Cron Initialized?
```bash
# In production logs, check for:
[CRON] ✓ Scheduled MORNING_REMINDER
[CRON] ✓ Scheduled EVENING_REMINDER
[CRON] ✓ Scheduled AUTO_LOGOUT
[CRON] ✓ Scheduled EARNED_LEAVE_ACCRUAL
```

#### Check 2: Verify Environment Variables
```bash
# Local: Check .env
CRON_MODE=node
IS_CRON_MASTER=true

# Production: Check Vercel Settings
```

#### Check 3: Database Connection
```bash
# Run test endpoint
curl http://localhost:3000/api/test-db
```

#### Check 4: Timezone Configuration
```typescript
// Should be in src/cron/nodeCron.ts
const TIMEZONE = "Asia/Kolkata";
```

---

### Issue 3: Cron Runs Multiple Times

**Symptoms:**
- Same cron appears to run every few seconds
- Database has duplicate entries

**Cause:**
Multiple Vercel instances running crons

**Solution:**
Ensure `IS_CRON_MASTER=true` is set so only one instance runs crons

---

### Issue 4: Time-based Issues

**Symptoms:**
- Morning reminder runs at wrong time
- Cron never triggers at scheduled time

**Check Timezone:**
```bash
# Verify timezone is set to IST
# Edit src/cron/nodeCron.ts
const TIMEZONE = "Asia/Kolkata";
```

**Check Cron Pattern:**
```bash
# Open src/cron/nodeCron.ts
# Verify cron patterns:
MORNING_REMINDER: "30 9 * * 1-5"    # 9:30 AM, Mon-Fri
EVENING_REMINDER: "30 20 * * 1-5"   # 8:30 PM, Mon-Fri
AUTO_LOGOUT: "59 23 * * *"           # 11:59 PM, Daily
EARNED_LEAVE: "0 0 1 * *"            # 12:00 AM, 1st of month
```

---

## Quick Commands Reference

### Local Development

```bash
# Start development server with cron logs
npm run dev

# Access status API
curl http://localhost:3000/api/cron/status

# Open Prisma Studio (view execution history)
npx prisma studio

# Trigger morning reminder manually
curl http://localhost:3000/api/cron/morning-reminder

# Trigger evening reminder manually
curl http://localhost:3000/api/cron/evening-reminder

# Trigger auto logout manually
curl http://localhost:3000/api/cron/auto-logout

# Trigger earned leave accrual manually
curl http://localhost:3000/api/cron/add-earned-leave
```

### Production (Vercel)

```bash
# Check status
curl https://your-app.vercel.app/api/cron/status

# Trigger morning reminder
curl https://your-app.vercel.app/api/cron/morning-reminder

# View Vercel logs
vercel logs --follow
```

---

## Summary

| Task | How to Check |
|------|-------------|
| **View all executions** | `GET /api/cron/status` |
| **See recent failures** | Prisma Studio > CronExecution, filter by status |
| **Monitor live** | Vercel Dashboard > Monitoring tab |
| **Test manually** | Call `/api/cron/{job-name}` endpoint |
| **Check timezone** | View `src/cron/nodeCron.ts` |
| **Verify database** | `npx prisma studio` > CronExecution table |

---

## Contact & Support

For issues or questions:
1. Check [CRON_SYSTEM.md](CRON_SYSTEM.md) for architecture details
2. Review [CRON_QUICK_REFERENCE.md](CRON_QUICK_REFERENCE.md) for quick lookup
3. Check server logs in Vercel dashboard
4. Verify database connection and migrations

