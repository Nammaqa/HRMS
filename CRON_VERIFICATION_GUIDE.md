# Cron Verification Guide

**Date:** February 17, 2026  
**Purpose:** Step-by-step process to verify all crons are working correctly

---

## Overview: 4 Crons to Check

1. **Morning Reminder** (9:30 AM IST, weekdays only)
2. **Evening Reminder** (8:30 PM IST, weekdays only)
3. **Auto Logout** (11:59 PM IST, every day)
4. **Earned Leave Accrual** (12:00 AM IST on 1st of month, employees only)

---

## Setup (One-time)

### 1. Get Your Environment Details

```bash
# Check .env file for CRON_SECRET
cat .env | grep CRON_SECRET
```

**Expected output:**

```
CRON_SECRET=your_secret_value_here
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### 2. Identify Your Deployment Host

- **Local dev:** `http://localhost:3000`
- **Staging/Production:** `https://yourdomain.com`
- **Vercel:** `https://project-name.vercel.app`

### 3. Start Your Server (if local)

```bash
npm run dev
# or
yarn dev
```

Wait for message like: "Ready in 1234ms" or "Server running on port 3000"

---

## Step-by-Step Testing

### Step 1: Test Morning Reminder

**Endpoint:** `POST /api/cron/morning-reminder`

#### 1a) Trigger the Cron (replace placeholders)

```powershell
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/morning-reminder" `
  -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" } `
  -Method Get

$response | ConvertTo-Json -Depth 10
```

**Expected Response:**

```json
{
  "success": true,
  "cronName": "morning-reminder",
  "totalUsers": 5,
  "successCount": 5,
  "skippedCount": 0,
  "failedCount": 0,
  "duration": "245ms",
  "message": "Total: 5, Success: 5, Skipped: 0, Failed: 0",
  "timestamp": "2026-02-17T04:00:00.000Z"
}
```

**What this means:**

- `totalUsers`: Count of eligible employees (no login + morning reminder not sent)
- `successCount`: Notifications created + flags updated
- `skippedCount`: Already notified (duplicate prevention)
- `failedCount`: Any errors during processing

#### 1b) Verify in Database

Run these SQL queries (use your database client):

**Check notifications created:**

```sql
SELECT
  id,
  userId,
  title,
  message,
  type,
  createdAt
FROM "Notification"
WHERE title = 'Morning Reminder'
  AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** Rows with `title = "Morning Reminder"`, `type = "ALERT"`, recent `createdAt`

**Check attendance flags updated:**

```sql
SELECT
  id,
  userId,
  date,
  loginTime,
  morningReminderSent,
  createdAt
FROM "Attendance"
WHERE morningReminderSent = true
  AND date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** `morningReminderSent = true` for eligible attendances

**Check audit logs:**

```sql
SELECT
  id,
  action,
  entityType,
  entityId,
  description,
  createdAt
FROM "AuditLog"
WHERE action = 'MORNING_REMINDER_SENT'
  AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** `action = "MORNING_REMINDER_SENT"` entries

---

### Step 2: Test Evening Reminder

**Endpoint:** `POST /api/cron/evening-reminder`

#### 2a) Trigger the Cron

```powershell
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/evening-reminder" `
  -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" } `
  -Method Get

$response | ConvertTo-Json -Depth 10
```

**Expected Response:**

```json
{
  "success": true,
  "cronName": "evening-reminder",
  "totalUsers": 3,
  "successCount": 3,
  "skippedCount": 0,
  "failedCount": 0,
  "duration": "312ms",
  "message": "Total: 3, Success: 3, Skipped: 0, Failed: 0",
  "timestamp": "2026-02-17T15:00:00.000Z"
}
```

#### 2b) Verify in Database

**Check checkout reminder notifications:**

```sql
SELECT
  id,
  userId,
  title,
  message,
  type,
  createdAt
FROM "Notification"
WHERE message LIKE '%check out%' OR message LIKE '%checkout%'
  AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** Notifications with checkout reminder messages

**Check leave approval notifications:**

```sql
SELECT
  id,
  userId,
  title,
  message,
  type,
  createdAt
FROM "Notification"
WHERE title LIKE '%Leave Request%'
  AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** Notifications for approved/rejected leave requests

**Check WFH approval notifications:**

```sql
SELECT
  id,
  userId,
  title,
  message,
  type,
  createdAt
FROM "Notification"
WHERE title LIKE '%WFH Request%'
  AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** Notifications for approved/rejected WFH requests

**Check attendance flags updated:**

```sql
SELECT
  id,
  userId,
  date,
  logoutTime,
  eveningReminderSent,
  createdAt
FROM "Attendance"
WHERE eveningReminderSent = true
  AND date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** `eveningReminderSent = true`

---

### Step 3: Test Auto Logout

**Endpoint:** `POST /api/cron/auto-logout`

#### 3a) Trigger the Cron

```powershell
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/auto-logout" `
  -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" } `
  -Method Get

$response | ConvertTo-Json -Depth 10
```

**Expected Response:**

```json
{
  "success": true,
  "cronName": "auto-logout",
  "totalUsers": 2,
  "successCount": 2,
  "skippedCount": 0,
  "failedCount": 0,
  "duration": "487ms",
  "message": "Total: 2, Success: 2, Skipped: 0, Failed: 0",
  "timestamp": "2026-02-17T18:29:00.000Z"
}
```

**What this means:**

- `totalUsers`: Count of open attendances (loginTime exists, logoutTime NULL)
- `successCount`: Auto-logout executed + audit logs created
- `failedCount`: Any errors

#### 3b) Verify in Database

**Check open attendances before cron (past dates):**

```sql
SELECT
  id,
  userId,
  date,
  loginTime,
  logoutTime,
  totalWorkingHours,
  status,
  createdAt
FROM "Attendance"
WHERE logoutTime IS NOT NULL
  AND loginTime IS NOT NULL
  AND remarks LIKE '%Auto logout%'
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, createdAt DESC
LIMIT 30;
```

**Expected:**

- `logoutTime` is set to `HH:59:59` (11:59:59 PM)
- `totalWorkingHours` is populated (decimal number)
- `status` is FULL_DAY or HALF_DAY_FIRST/SECOND
- `remarks` contains "Auto logout by system"

**Check auto logout audit logs:**

```sql
SELECT
  id,
  action,
  entityType,
  entityId,
  description,
  createdAt
FROM "AuditLog"
WHERE action = 'AUTO_LOGOUT'
  AND createdAt >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY createdAt DESC
LIMIT 30;
```

**Expected:** `action = "AUTO_LOGOUT"` entries with user names and working hours in description

**Check specific date (e.g., yesterday):**

```sql
SELECT
  id,
  userId,
  date,
  loginTime,
  logoutTime,
  totalWorkingHours,
  status
FROM "Attendance"
WHERE date = '2026-02-16'::date
  AND logoutTime IS NOT NULL
ORDER BY userId;
```

**Expected:** All attendances for that date have `logoutTime` set

---

### Step 4: Test Earned Leave Accrual

**Endpoint:** `POST /api/cron/add-earned-leave`  
**Note:** Runs on 1st of month only. Can test by temporarily changing the date or checking last run.

#### 4a) Trigger the Cron

```powershell
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/add-earned-leave" `
  -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" } `
  -Method Get

$response | ConvertTo-Json -Depth 10
```

**Expected Response:**

```json
{
  "success": true,
  "cronName": "add-earned-leave",
  "totalUsers": 10,
  "successCount": 10,
  "skippedCount": 0,
  "failedCount": 0,
  "duration": "156ms",
  "message": "Total: 10, Success: 10, Skipped: 0, Failed: 0",
  "timestamp": "2026-02-01T00:00:00.000Z"
}
```

#### 4b) Verify in Database

**Check leave balance increased:**

```sql
SELECT
  id,
  userId,
  earnedLeave,
  lastAccrualDate,
  createdAt
FROM "LeaveBalance"
WHERE lastAccrualDate >= CURRENT_DATE - INTERVAL '5 days'
ORDER BY lastAccrualDate DESC
LIMIT 20;
```

**Expected:**

- `earnedLeave` increased (e.g., from 5 to 6.25)
- `lastAccrualDate` set to 1st of current month
- Max cap: 30 days

**Check audit logs:**

```sql
SELECT
  id,
  action,
  entityType,
  entityId,
  description,
  createdAt
FROM "AuditLog"
WHERE action = 'EARNED_LEAVE_ACCRUAL'
  AND createdAt >= CURRENT_DATE - INTERVAL '5 days'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:** `action = "EARNED_LEAVE_ACCRUAL"` with user names and new balance

---

## Cron Execution Logs Table

Check when each cron last ran:

```sql
SELECT
  id,
  cronName,
  status,
  totalUsers,
  successCount,
  skippedCount,
  failedCount,
  message,
  finishedAt
FROM "CronExecution"
WHERE finishedAt >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY finishedAt DESC
LIMIT 50;
```

**Expected:**

- `status = "SUCCESS"` (not much fails if database is healthy)
- `totalUsers` matches your employee count
- `successCount` equals or near `totalUsers`
- `finishedAt` shows recent timestamps

---

## Quick Health Check (All at Once)

Run this once to see overall cron health:

```sql
-- How many morning reminders sent today?
SELECT COUNT(*) as morning_reminders
FROM "Notification"
WHERE title = 'Morning Reminder'
  AND createdAt::date = CURRENT_DATE;

-- How many leave/WFH approvals notified today?
SELECT COUNT(*) as approval_notifications
FROM "Notification"
WHERE (title LIKE '%Leave Request%' OR title LIKE '%WFH Request%')
  AND createdAt::date = CURRENT_DATE;

-- How many auto-logouts executed (all time)?
SELECT COUNT(*) as auto_logouts
FROM "AuditLog"
WHERE action = 'AUTO_LOGOUT';

-- How many earned leave accruals?
SELECT COUNT(*) as el_accruals
FROM "AuditLog"
WHERE action = 'EARNED_LEAVE_ACCRUAL';

-- Last execution of each cron:
SELECT
  cronName,
  status,
  finishedAt
FROM "CronExecution"
WHERE finishedAt = (
  SELECT MAX(finishedAt) FROM "CronExecution" c2
  WHERE c2."cronName" = "CronExecution"."cronName"
)
ORDER BY finishedAt DESC;
```

---

## Troubleshooting

### Cron Returns 401 Unauthorized

- ❌ Check: `CRON_SECRET` mismatch in Authorization header
- ✅ Fix: Verify `CRON_SECRET` in `.env` matches header value

### Cron Returns Success but No DB Changes

- ❌ Check: `totalUsers = 0` (no eligible rows found)
- ✅ Fix: Create test data or check filtering logic

### Lost/Missed Crons

- ❌ Check: Spelling/casing of cron name in URL
- ✅ Fix: Use exact names: `morning-reminder`, `evening-reminder`, `auto-logout`, `add-earned-leave`

### Database Connection Error

- ❌ Check: `DATABASE_URL` in `.env` is wrong
- ✅ Fix: Verify credentials, host, port, database name

---

## Summary Checklist

- [ ] Morning Reminder: Notifications created, `morningReminderSent = true`, audit logs exist
- [ ] Evening Reminder: Checkout reminders, leave/WFH approvals notified, audit logs exist
- [ ] Auto Logout: Open attendances closed, `logoutTime` set to 11:59:59, `totalWorkingHours` populated, `status` updated, audit logs exist
- [ ] Earned Leave: `earnedLeave` increased by 1.25 (max 30), `lastAccrualDate` updated, audit logs exist
- [ ] CronExecution table: Recent entries with `status = SUCCESS`
- [ ] All endpoints return 200 and success response

---

## Next Steps

1. Run one cron at a time using the commands above.
2. Check each response for `"success": true`.
3. Run the corresponding SQL verification query.
4. Confirm database rows match expectations.
5. If any cron fails, share the error response and I'll debug.
