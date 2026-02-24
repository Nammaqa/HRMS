# Cron Verification Checklist & Report Template

Use this template to document your cron verification test results.

---

## Test Session: `[DATE & TIME]`

**Tester:** `[Your Name]`  
**Environment:** `[Local / Staging / Production]`  
**Server:** `[http://localhost:3000 / your domain]`

---

## Step 1: Pre-Test Checks

- [ ] Server is running (check terminal for "Ready" message)
- [ ] `.env` file has `CRON_SECRET` set
- [ ] Database is accessible
- [ ] Have SQL client ready (pgAdmin, DBeaver, or psql CLI)

---

## Step 2: Run Test Endpoint (All Crons at Once)

**Command:**

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/test-all" `
  -Method Get | ConvertTo-Json -Depth 10
```

**Response:** (paste JSON response here)

```json
{
  "success": true,
  "timestamp": "2026-02-17T...",
  "summary": {
    "cronsTested": 4,
    "cronsSuccessful": 4,
    "totalUsersProcessed": 25,
    "totalActionsSuccess": 25,
    "totalActionsFailed": 0
  },
  "results": [
    ...
  ]
}
```

**Initial Assessment:**

- [ ] `success = true`
- [ ] All 4 crons in results array
- [ ] Each cron has `"success": true`
- [ ] `totalActionsFailed = 0`
- [ ] `cronsTested = 4` and `cronsSuccessful = 4`

---

## Step 3: Detailed Verification by Cron

### Cron 1: Morning Reminder ✓/✗

**Response Details:**

```
cronName: morning-reminder
totalUsers: ___
successCount: ___
skippedCount: ___
failedCount: ___
duration: ___ ms
message: ___
```

**Database Check 1.1: Notifications Created**

Run query:

```sql
SELECT COUNT(*) as count
FROM "Notification"
WHERE title = 'Morning Reminder'
  AND createdAt::date = CURRENT_DATE;
```

- Result: `___` notifications
- [ ] Count matches or exceeds `successCount` from response

**Database Check 1.2: Attendance Flags Updated**

Run query:

```sql
SELECT COUNT(*) as count
FROM "Attendance"
WHERE morningReminderSent = true
  AND date = CURRENT_DATE;
```

- Result: `___` attendance records
- [ ] Matches `successCount`

**Database Check 1.3: Audit Logs**

Run query:

```sql
SELECT COUNT(*) as count
FROM "AuditLog"
WHERE action = 'MORNING_REMINDER_SENT'
  AND createdAt::date = CURRENT_DATE;
```

- Result: `___` audit logs
- [ ] Matches `successCount`

**Status:** [ ] ✓ PASS [ ] ✗ FAIL (note reason if fail)

---

### Cron 2: Evening Reminder ✓/✗

**Response Details:**

```
cronName: evening-reminder
totalUsers: ___
successCount: ___
skippedCount: ___
failedCount: ___
duration: ___ ms
message: ___
```

**Database Check 2.1: Checkout Reminders**

Run query:

```sql
SELECT COUNT(*) as count
FROM "Notification"
WHERE message LIKE '%check out%'
  AND createdAt::date = CURRENT_DATE;
```

- Result: `___` notifications
- [ ] At least 1 checkout reminder sent (if employees still logged in)

**Database Check 2.2: Leave Approvals Notified**

Run query:

```sql
SELECT COUNT(*) as count
FROM "Notification"
WHERE title LIKE '%Leave Request%'
  AND createdAt::date = CURRENT_DATE;
```

- Result: `___` notifications
- [ ] Any pending leave approvals were notified

**Database Check 2.3: WFH Approvals Notified**

Run query:

```sql
SELECT COUNT(*) as count
FROM "Notification"
WHERE title LIKE '%WFH Request%'
  AND createdAt::date = CURRENT_DATE;
```

- Result: `___` notifications
- [ ] Any pending WFH approvals were notified

**Database Check 2.4: Attendance Flags Updated**

Run query:

```sql
SELECT COUNT(*) as count
FROM "Attendance"
WHERE eveningReminderSent = true
  AND date = CURRENT_DATE;
```

- Result: `___` attendance records
- [ ] Matches or close to `successCount`

**Status:** [ ] ✓ PASS [ ] ✗ FAIL (note reason if fail)

---

### Cron 3: Auto Logout ✓/✗

**Response Details:**

```
cronName: auto-logout
totalUsers: ___
successCount: ___
skippedCount: ___
failedCount: ___
duration: ___ ms
message: ___
```

**Database Check 3.1: Open Attendances Closed**

Run query:

```sql
SELECT
  id, userId, date, loginTime, logoutTime,
  totalWorkingHours, status
FROM "Attendance"
WHERE date = '2026-02-16'::date
  AND logoutTime IS NOT NULL
ORDER BY userId;
```

- Result: `___` rows
- [ ] All rows have `logoutTime` set to `23:59:59`
- [ ] All rows have `totalWorkingHours` populated
- [ ] All rows have `status` set (FULL*DAY or HALF_DAY*\*)

**Sample row:**

```
id: ___
loginTime: 2026-02-16T13:16:07.020Z
logoutTime: 2026-02-16T23:59:59.000Z
totalWorkingHours: ___
status: FULL_DAY / HALF_DAY_FIRST / HALF_DAY_SECOND
```

**Database Check 3.2: Audit Logs**

Run query:

```sql
SELECT
  id, action, entityType, description, createdAt
FROM "AuditLog"
WHERE action = 'AUTO_LOGOUT'
  AND createdAt::date = CURRENT_DATE
ORDER BY createdAt DESC
LIMIT 20;
```

- Result: `___` audit logs
- [ ] Matches `successCount`
- [ ] Descriptions include user names and working hours

**Sample log:**

```
action: AUTO_LOGOUT
description: "Auto logout executed for Shubhashree R at 11:59 PM. Total working hours: 10.45"
```

**Status:** [ ] ✓ PASS [ ] ✗ FAIL (note reason if fail)

---

### Cron 4: Earned Leave Accrual ✓/✗

**Response Details:**

```
cronName: add-earned-leave
totalUsers: ___
successCount: ___
skippedCount: ___
failedCount: ___
duration: ___ ms
message: ___
```

**Note:** This cron runs only on the 1st of the month. If today is not the 1st, `totalUsers` will be 0 (expected).

**Database Check 4.1: Leave Balance Increased** (only if running on 1st of month)

Run query:

```sql
SELECT
  id, userId, earnedLeave, lastAccrualDate
FROM "LeaveBalance"
WHERE lastAccrualDate::date = CURRENT_DATE
ORDER BY userId;
```

- Result: `___` rows
- [ ] `earnedLeave` increased by 1.25 (or less if at 30-day cap)
- [ ] `lastAccrualDate` = today's date

**Sample row:**

```
id: 1
userId: 2
earnedLeave: 6.25 (was 5.0 before accrual)
lastAccrualDate: 2026-03-01
```

**Database Check 4.2: Audit Logs** (only if running on 1st of month)

Run query:

```sql
SELECT
  id, action, description, createdAt
FROM "AuditLog"
WHERE action = 'EARNED_LEAVE_ACCRUAL'
  AND createdAt::date = CURRENT_DATE
LIMIT 20;
```

- Result: `___` audit logs
- [ ] Matches `successCount`

**Status:** [ ] ✓ PASS [ ] ✗ FAIL (note reason if fail)  
**Note:** `___`

---

## Step 4: CronExecution Log Verification

Run query:

```sql
SELECT
  cronName, status, totalUsers, successCount, failedCount, finishedAt
FROM "CronExecution"
ORDER BY finishedAt DESC
LIMIT 10;
```

**Results:**

```
| cronName            | status  | totalUsers | successCount | failedCount | finishedAt              |
|---------------------|---------|------------|--------------|-------------|-------------------------|
| MORNING_REMINDER    | SUCCESS | ___        | ___          | ___         | 2026-02-17T...          |
| EVENING_REMINDER    | SUCCESS | ___        | ___          | ___         | 2026-02-17T...          |
| AUTO_LOGOUT         | SUCCESS | ___        | ___          | ___         | 2026-02-17T...          |
| EARNED_LEAVE_ACCRUAL| SUCCESS | ___        | ___          | ___         | 2026-02-17T...          |
```

- [ ] All statuses = `SUCCESS`
- [ ] All `failedCount` = 0 or very low
- [ ] Timestamps are recent

---

## Overall Summary

**Total Crons Tested:** 4

| Cron             | Status      | Notes  |
| ---------------- | ----------- | ------ |
| Morning Reminder | [ ] ✓ [ ] ✗ | \_\_\_ |
| Evening Reminder | [ ] ✓ [ ] ✗ | \_\_\_ |
| Auto Logout      | [ ] ✓ [ ] ✗ | \_\_\_ |
| Earned Leave     | [ ] ✓ [ ] ✗ | \_\_\_ |

**Overall Result:** [ ] ✓ ALL PASS [ ] ✗ SOME FAILURES

**Issues Found:**

```
1. ___
2. ___
3. ___
```

**Next Actions:**

```
- ___
- ___
```

---

## Quick Copy-Paste SQL for All Checks

Run all these at once to get a complete snapshot:

```sql
-- Morning Reminder
SELECT 'morning_notifications' as check, COUNT(*) as count FROM "Notification" WHERE title = 'Morning Reminder' AND createdAt::date = CURRENT_DATE
UNION ALL
SELECT 'morning_attendance_flags', COUNT(*) FROM "Attendance" WHERE morningReminderSent = true AND date = CURRENT_DATE
UNION ALL
SELECT 'morning_audit_logs', COUNT(*) FROM "AuditLog" WHERE action = 'MORNING_REMINDER_SENT' AND createdAt::date = CURRENT_DATE
UNION ALL
-- Evening Reminder
SELECT 'evening_checkout_reminders', COUNT(*) FROM "Notification" WHERE message LIKE '%check%' AND createdAt::date = CURRENT_DATE
UNION ALL
SELECT 'evening_attendance_flags', COUNT(*) FROM "Attendance" WHERE eveningReminderSent = true AND date = CURRENT_DATE
UNION ALL
SELECT 'evening_audit_logs', COUNT(*) FROM "AuditLog" WHERE action = 'EVENING_REMINDER_SENT' AND createdAt::date = CURRENT_DATE
UNION ALL
-- Auto Logout
SELECT 'auto_logout_closed_attendances', COUNT(*) FROM "Attendance" WHERE date = CURRENT_DATE - INTERVAL '1 day' AND logoutTime IS NOT NULL
UNION ALL
SELECT 'auto_logout_audit_logs', COUNT(*) FROM "AuditLog" WHERE action = 'AUTO_LOGOUT' AND createdAt::date = CURRENT_DATE
UNION ALL
-- Earned Leave (only if 1st of month)
SELECT 'earned_leave_accruals', COUNT(*) FROM "LeaveBalance" WHERE lastAccrualDate::date = CURRENT_DATE
UNION ALL
SELECT 'earned_leave_audit_logs', COUNT(*) FROM "AuditLog" WHERE action = 'EARNED_LEAVE_ACCRUAL' AND createdAt::date = CURRENT_DATE;
```

**Results:**

```
| check | count |
|-------|-------|
| ___ | ___ |
| ___ | ___ |
```

---

## Sign-off

- [ ] All crons verified and working
- [ ] Database state is correct
- [ ] No errors in server logs
- [ ] Ready for production / next iteration

**Date Verified:** `___`  
**Verified By:** `___`  
**Approval:** [ ] ✓ Approved [ ] ✗ Needs Work
