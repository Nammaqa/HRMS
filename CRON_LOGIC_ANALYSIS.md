# Cron Logic Analysis & Verification Report

**Date:** March 5, 2026  
**Status:** ✅ Logic Review Complete

---

## 📋 Executive Summary

The cron system consists of **4 main jobs** executing on two platforms:
- **Vercel (Testing/Staging):** API endpoints with bearer token auth
- **DigitalOcean (Production):** Node-cron with instance isolation

All jobs follow proper transaction patterns, duplicate prevention, and audit logging.

---

## 🔍 Detailed Logic Review

### 1. **MORNING REMINDER** (9:30 AM IST, Mon-Fri only)
**File:** [src/cron/logic/morning.ts](src/cron/logic/morning.ts)

#### Purpose:
Sends morning checkin reminders to employees who haven't logged in yet.

#### Logic Flow:

```
1. Check Date/Time
   ├─ Get current IST time
   ├─ Skip if weekend (Sat/Sun)
   └─ Skip if admin-defined holiday

2. Find Eligible Users (Two Groups):
   
   GROUP A: Users WITH attendance record but not logged in
   ├─ Condition: attendance.loginTime IS NULL
   ├─ AND morningReminderSent = false
   └─ Process with flag update (prevents duplicates)
   
   GROUP B: Users WITHOUT any attendance record today
   ├─ Condition: No attendance record exists
   ├─ Check for duplicate notifications today
   └─ Skip if already notified (duplicate prevention)

3. For Each User in GROUP A:
   ├─ Transaction START
   │  ├─ Create Notification
   │  ├─ Update attendance.morningReminderSent = true
   │  └─ Log AuditLog
   ├─ Transaction END
   └─ Send email (non-blocking, catch errors separately)

4. For Each User in GROUP B:
   ├─ Check for existing notification today
   ├─ Skip if already notified
   ├─ Transaction START
   │  ├─ Create Notification
   │  └─ Log AuditLog
   ├─ Transaction END
   └─ Send email (non-blocking)

5. Return Summary:
   ├─ totalUsers: GROUP A length + GROUP B length
   ├─ successCount: successful notifications
   ├─ skippedCount: users skipped (already notified)
   └─ failedCount: users with errors
```

#### ✅ Strengths:
- **Duplicate Prevention:** Uses `morningReminderSent` flag for GROUP A
- **Transactions:** All DB operations wrapped in `$transaction()`
- **Error Handling:** Per-user try-catch with graceful degradation
- **Email Resilience:** Email failures don't block notification creation
- **Two-Group Logic:** Catches users with AND without attendance records

#### ⚠️ Potential Issues:

**Issue 1: GROUP B Duplicate Prevention Logic Flaw**
- **Problem:** Checks for existing notification AFTER fetching user list with `take: 500`
  ```typescript
  const usersWithoutAttendance = await prisma.user.findMany({
    where: { role: "employee", attendances: { none: { ... } } },
    take: 500,  // ← Only first 500 users, may miss others
  });
  ```
- **Risk:** If you have >500 employees without attendance, they're skipped. Next run will try to notify them again (but duplicate check inside loop should catch it).
- **Recommendation:** Add pagination or increase limit, OR use a more robust deduplication strategy.

**Issue 2: Total Users Count Mismatch**
- **Problem:** `summary.totalUsers = eligibleAttendances.length + usersWithoutAttendance.length`
- **Actually Processed:** Less if duplicates are skipped in GROUP B
- **Impact:** Reporting shows misleading "totalUsers" (counts users skipped for duplicates)
- **Recommendation:** Move totalUsers calculation to end, after counting actual processing.

**Issue 3: Email Path Concerns**
- Uses relative path: `../../utils/mailer` 
- Should verify that the mailer exists at that location and is correctly exported

---

### 2. **EVENING REMINDER** (8:30 PM IST, Mon-Fri only)
**File:** [src/cron/logic/evening.ts](src/cron/logic/evening.ts)

#### Purpose:
Sends two types of notifications:
1. **Checkout Reminders** to logged-in employees
2. **Approval Notifications** for Leave/WFH request decisions

#### Logic Flow:

```
1. Check Date/Time
   ├─ Get current IST time
   ├─ Skip if weekend
   └─ Skip if holiday

2. Send Checkout Reminders:
   ├─ Find attendance records where:
   │  ├─ loginTime NOT NULL (logged in)
   │  ├─ logoutTime IS NULL (not logged out)
   │  └─ eveningReminderSent = false
   ├─ For each: Create notification, update flag, log audit
   └─ Send email

3. Send Leave Request Approvals:
   ├─ Find LeaveRequest records where:
   │  ├─ status IN [APPROVED, REJECTED]
   │  ├─ notificationSent = false
   │  └─ take: 100 (batch processing)
   ├─ For each: Create notification, update flag, log audit
   └─ Send email with approval details

4. Send WFH Request Approvals:
   ├─ Find WFHRequest records where:
   │  ├─ status IN [APPROVED, REJECTED]
   │  ├─ notificationSent = false
   │  └─ take: 100 (batch processing)
   ├─ For each: Create notification, update flag, log audit
   └─ Send email with approval details

5. Return Summary:
   └─ totalUsers = checkout count + leave approvals + WFH approvals
```

#### ✅ Strengths:
- **Flag-Based Deduplication:** `eveningReminderSent` and `notificationSent` flags
- **Batch Processing:** Uses `take: 100` for leave/WFH queries (prevents memory bloat)
- **Transaction Wrappers:** All updates atomic
- **Rich Notifications:** Different icons (✅/❌) and types (SUCCESS/ALERT)
- **Email Content:** Uses approval data with dates and request type

#### ⚠️ Potential Issues:

**Issue 1: Leave/WFH Batch Size (100) May Be Too Small**
```typescript
const leaveApprovals = await prisma.leaveRequest.findMany({
  where: { status: { in: ["APPROVED", "REJECTED"] }, notificationSent: false },
  take: 100,  // ← Only processes 100 per run
});
```
- **Problem:** If you have 500 pending approvals, only 100 are processed per night
- **Recovery:** Next run will process the remaining 100, so eventually all will be notified
- **Recommendation:** Increase to 500-1000 or add pagination to process all in one run

**Issue 2: Icon Field Empty for Checkout**
```typescript
icon: "",  // ← String is empty!
```
- **Problem:** Checkout reminder has empty icon. Should be something like "🛑" or "⏰"
- **Impact:** UI inconsistency
- **Fix:** Set `icon: "⏰"` or similar

**Issue 3: Missing WFH Approval Email Date Handling**
```typescript
const dates = wfh.date
  ? new Date(wfh.date).toLocaleDateString('en-IN')
  : 'TBD';
```
- **Issue:** WFH only has single `date` field (not date range like Leave)
- **Current Logic:** Converts properly, but dates string will be formatted differently than LeaveRequest
- **Recommendation:** Ensure email template handles both string formats correctly

---

### 3. **AUTO LOGOUT** (11:59 PM IST, Every Day)
**File:** [src/cron/logic/autoLogout.ts](src/cron/logic/autoLogout.ts)

#### Purpose:
Automatically logs out any employee still logged in at EOD, prevents long working hour tracking errors.

#### Logic Flow:

```
1. Find Open Attendance Records:
   ├─ loginTime NOT NULL (logged in)
   ├─ logoutTime IS NULL (not logged out)
   └─ Within lookback range (default: 1 day, allows backfill)

2. Fallback Search (if none found):
   ├─ Expand search to last 7 days
   └─ Backfill any missed auto-logouts

3. For Each Open Attendance:
   ├─ Calculate logout time = 11:59:59 PM of attendance date (IST)
   ├─ Calculate totalWorkingHours
   ├─ Determine status:
   │  ├─ FULL_DAY: ≥ 8.5 hours
   │  ├─ HALF_DAY: 4-8.5 hours (split based on login time vs 12:30 PM)
   │  └─ ABSENT: < 4 hours
   ├─ Transaction START:
   │  ├─ Update attendance with logout & status
   │  ├─ Create AuditLog
   │  └─ Create warning notification
   ├─ Transaction END
   └─ Send email warning (non-blocking)

4. Return Summary:
   ├─ totalUsers: number of auto-logged-out users
   ├─ successCount: successful updates
   ├─ skippedCount: 0 (no skip logic)
   └─ failedCount: updates that failed
```

#### ✅ Strengths:
- **Backfill Support:** 7-day fallback catches missed runs
- **Smart Status Calculation:** Uses working hours + login time to determine half-day
- **EL Deduction Warning:** Notifies user of impending EL deduction
- **Complete Audit:** Every action logged for compliance

#### ⚠️ Potential Issues:

**Issue 1: Duplicate Tracking (No Idempotency)**
```typescript
// First run processes: User A logged at 10 AM, auto-logged at 11:59 PM
// Second run on same day would:
// - NOT find User A again (logoutTime now set)
// - So no duplicate risk here ✓
```
- **Actually OK:** Flag-based (logoutTime), so idempotent. Good design.

**Issue 2: Lookback Logic Complexity**
```typescript
const startRange = subDays(today, lookbackDays);  // default lookbackDays=1
const logoutTime = setHours(setMinutes(setSeconds(endOfToday, 59), 59), 23);
```
- **Problem:** If run is delayed (e.g., runs at 1 AM instead of 11:59 PM), lookback still only covers yesterday
- **Better Approach:** Could use larger default lookback or add env var to configure
- **Current Impact:** Medium - most runs happen on schedule, delayed runs would only miss 1-2 days

**Issue 3: Status Calculation Assumes 12:30 PM as Half-Day Break**
```typescript
const halfDayBreak = 12.5 * 60; // 12:30 PM in minutes
attendanceStatus = loginTotalMinutes < halfDayBreak ? "HALF_DAY_FIRST" : "HALF_DAY_SECOND";
```
- **Issue:** Hard-coded 12:30 PM break point
- **Reality Check:** Is 12:30 PM the official half-day cutoff in your org?
- **Recommendation:** Make this a config constant or environment variable

**Issue 4: Working Hours Always Calculated to 11:59 PM**
- **Issue:** Auto-logout assumes employee worked until 11:59:59 PM
- **Reality:** If someone logs in at 11 PM, they're shown as worked 1 minute (11:59 - 11:00)
- **This is Correct:** Based on requirements, system always logs them out at 11:59 PM

---

### 4. **EARNED LEAVE ACCRUAL** (12:00 AM on 1st of Month, IST)
**File:** [src/cron/logic/earnedLeave.ts](src/cron/logic/earnedLeave.ts)

#### Purpose:
Monthly earned leave accrual (1.25 days per month, max 30 days total)

#### Logic Flow:

```
1. Get Current Month/Year (IST):
   └─ Used for duplicate prevention check

2. For Each Employee's LeaveBalance:
   ├─ Check if accrual already done this month
   │  ├─ If lastAccrualDate is in current month/year → SKIP
   │  └─ Prevents duplicate accruals on repeated triggers
   │
   ├─ Check if employee just joined this month
   │  ├─ If dateOfJoining is in current month → SKIP
   │  └─ Rationale: Don't accrue for partial first month
   │
   ├─ Transaction START:
   │  ├─ Add 1.25 to earnedLeave
   │  ├─ Cap at 30 days maximum (no overflow)
   │  ├─ Update lastAccrualDate = today
   │  └─ Create AuditLog
   ├─ Transaction END
   │
   └─ Count as success

3. Return Summary:
   ├─ totalUsers: all employees with LeaveBalance
   ├─ successCount: successfully accrued
   ├─ skippedCount: already accrued this month
   └─ failedCount: accrual errors
```

#### ✅ Strengths:
- **Strict Duplicate Prevention:** `lastAccrualDate` check by month/year
- **New Hire Handling:** Skips accrual for employees who just joined
- **Cap Enforcement:** Hard max of 30 days (no overflow)
- **Minimal Logic:** Simple, clear, auditible

#### ⚠️ Potential Issues:

**Issue 1: Carry Forward Rules Not Enforced in Accrual**
```typescript
const newEarnedLeave = Math.min(
  balance.earnedLeave + MONTHLY_ACCRUAL,
  30  // Max 30 days total
);
```
- **Problem:** Documentation mentions "max 10 days carry forward within 30-day limit" but code only enforces 30-day max
- **Missing Logic:** Should there be logic like: `earnedLeave > 10 ? cap at 10 : allow full 30`?
- **Need Clarification:** What is the actual carry-forward policy?
  - Option A: Max 30 days total (current code)
  - Option B: Max 10 days carry forward, but can accrue up to 30 if at start of year (not implemented)
  - Option C: Something else?

**Issue 2: No Notification to Employee**
- **Observation:** Unlike other crons, earned leave accrual does NOT create notifications
- **Question:** Should employees be notified when their leave balance is updated?
- **Recommendation:** Add optional notification:
  ```typescript
  await tx.notification.create({
    data: {
      userId: balance.userId,
      title: "Earned Leave Accrued",
      message: `Your earned leave has been increased by 1.25 days. New balance: ${newEarnedLeave} days`,
      type: "INFO",
      icon: "📅",
    },
  });
  ```

**Issue 3: New Hire Skip Logic May Be Incorrect**
```typescript
if (!balance.lastAccrualDate && balance.user?.dateOfJoining) {
  const doj = new Date(balance.user.dateOfJoining);
  const joinMonth = getMonth(doj);
  const joinYear = getYear(doj);
  if (joinMonth === currentMonth && joinYear === currentYear) {
    summary.skippedCount++;
    continue;
  }
}
```
- **Logic Flow:**
  - If `lastAccrualDate` is null (never accrued)
  - AND employee joined in current month
  - THEN skip accrual
- **Example:** Employee joins Feb 15, 2026. On March 1:
  - joinMonth = 2, currentMonth = 3 → NOT equal → NOT skipped → ✓ Accrual happens
  - ✓ Correct behavior
- **Example 2:** Employee joins March 5, 2026. On March 1:
  - This shouldn't happen (accrual runs before they join) → N/A
- **Looks OK:** Logic appears correct

---

## 🔄 Cross-Job Analysis

### Execution Flow (Vercel)
```
Request → /api/cron/{job} 
  ↓
GET request with Authorization header Bearer {CRON_SECRET}
  ↓
executor.ts: validateCronSecret()
  ↓
executor.ts: executeCronJob(jobType)
  ↓
logic/{job}.ts: execute{Job}Reminder/Accrual()
  ↓
Returns ExecutionResult
  ↓
logCronExecution() → CronExecution table
  ↓
NextResponse.json(result)
```

### Execution Flow (Node-Cron)
```
App Startup
  ↓
Check: CRON_MODE === "node" && IS_CRON_MASTER === "true"
  ↓
initializeCronJobs()
  ↓
For each job: cron.schedule(schedule, handler)
  ↓
At scheduled time: handler() executes
  ↓
Creates CronExecution (STARTED)
  ↓
logic/{job}.ts: execute{Job}Reminder/Accrual()
  ↓
Updates CronExecution (SUCCESS/PARTIAL_SUCCESS/FAILED)
  ↓
Logs execution details
```

### Shared Executor Pattern ✓
- Both Vercel and Node-Cron use same business logic functions
- Ensures consistent behavior across platforms
- **Good design:** Single source of truth for logic

---

## 🕐 Schedule Verification

### Vercel (UTC times)
```
Morning Reminder:    0 4 * * *     → 4:00 AM UTC
  = 9:30 AM IST ✓ (4 AM UTC + 5:30 hours)
  Issue: Should be 4:00 AM, but morning reminder is 9:30 AM. Mismatch?
  
Evening Reminder:    0 15 * * *    → 3:00 PM UTC  
  = 8:30 PM IST ✓ (3 PM UTC + 5:30 hours)
  Issue: Same - 8:30 PM is 3:00 PM UTC, matches ✓

Auto Logout:         29 18 * * *   → 6:29 PM UTC
  = 11:59 PM IST ✓ (6:29 PM UTC + 5:30 hours = 11:59 PM IST)
  ✓ Correct

Earned Leave:        0 0 1 * *     → 12:00 AM UTC on 1st
  = 5:30 AM IST on 1st
  ❌ ISSUE: Should be 12:00 AM IST (1st), not 5:30 AM IST (1st)
  Should be: 6:30 PM on 30th (UTC) or adjusted schedule
```

**CRITICAL ISSUE:** Earned leave accrual runs at 5:30 AM IST on 1st, not 12:00 AM!

### Node-Cron (IST times - Direct)
```
Morning Reminder:    30 9 * * 1-5   → 9:30 AM IST, Mon-Fri ✓
Evening Reminder:    30 20 * * 1-5  → 8:30 PM IST, Mon-Fri ✓
Auto Logout:         59 23 * * *    → 11:59 PM IST, Daily ✓
Earned Leave:        0 0 1 * *      → 12:00 AM IST, 1st of month ✓
```

---

## 🐛 Issues Found

### [CRITICAL] Issue #1: Earned Leave Accrual Schedule Error (Vercel)
- **Severity:** HIGH
- **Location:** [vercel.json](vercel.json) line 11
- **Problem:** Schedule `"0 0 1 * *"` is UTC time, runs at 5:30 AM IST (1st), not 12:00 AM IST
- **Expected:** Should run at 12:00 AM IST on the 1st
- **Fix:** Change to `"18 30 30 * *"` (6:30 PM UTC on 30th = 12:00 AM IST on 1st)
  ```json
  {
    "path": "/api/cron/add-earned-leave",
    "schedule": "18 30 30 * *"  // 6:30 PM UTC on 30th → 12:00 AM IST on 1st
  }
  ```

### [HIGH] Issue #2: GROUP B Users Limited to 500 (Morning Reminder)
- **Location:** [src/cron/logic/morning.ts](src/cron/logic/morning.ts#L86)
- **Problem:** `take: 500` limits processing
- **Impact:** If >500 employees without attendance, they're skipped
- **Fix:** Add pagination or increase limit significantly
  ```typescript
  const usersWithoutAttendance = await prisma.user.findMany({
    where: {
      role: "employee",
      attendances: { none: { date: { gte: today, lt: tomorrow } } },
    },
    take: 5000,  // Increase from 500
  });
  ```

### [MEDIUM] Issue #3: Misleading Total Users Count (Morning Reminder)
- **Location:** [src/cron/logic/morning.ts](src/cron/logic/morning.ts#L106)
- **Problem:** `totalUsers` includes skipped duplicate users
- **Impact:** Reports misleading totals
- **Fix:** Move count to after processing:
  ```typescript
  summary.totalUsers = summary.successCount + summary.skippedCount + summary.failedCount;
  ```

### [MEDIUM] Issue #4: Leave/WFH Approvals Limited to 100 (Evening Reminder)
- **Location:** [src/cron/logic/evening.ts](src/cron/logic/evening.ts#L152)
- **Problem:** Only processes 100 per run (same for WFH)
- **Impact:** Large queues take multiple days to process
- **Fix:** Increase batch size:
  ```typescript
  take: 500,  // Increase from 100
  ```

### [MEDIUM] Issue #5: Missing Icon for Checkout Reminder (Evening Reminder)
- **Location:** [src/cron/logic/evening.ts](src/cron/logic/evening.ts#L104)
- **Problem:** `icon: ""` is empty string
- **Impact:** UI inconsistency
- **Fix:** Add appropriate icon:
  ```typescript
  icon: "⏰",  // Clock icon for checkout reminder
  ```

### [LOW] Issue #6: Undefined Carry-Forward Logic (Earned Leave Accrual)
- **Location:** [src/cron/logic/earnedLeave.ts](src/cron/logic/earnedLeave.ts#L77-L80)
- **Problem:** Documentation mentions "max 10 days carry forward" but code only enforces 30-day total
- **Impact:** Unclear if carry-forward policy is correctly implemented
- **Action Needed:** Clarify business rule
  - Current code: Max 30 days total (no additional carry-forward logic)
  - Is this correct?
  - If not, need additional logic to cap carry-forward at 10 days

### [LOW] Issue #7: No Notifications for Leave Accrual
- **Location:** [src/cron/logic/earnedLeave.ts](src/cron/logic/earnedLeave.ts)
- **Problem:** Unlike other crons, no employee notification created
- **Impact:** Employees unaware of leave balance updates
- **Recommendation:** Add optional notification (nice-to-have, not critical)

### [LOW] Issue #8: Hard-Coded Half-Day Cutoff (Auto Logout)
- **Location:** [src/cron/logic/autoLogout.ts](src/cron/logic/autoLogout.ts#L125)
- **Problem:** Half-day break hard-coded to 12:30 PM
- **Impact:** May not match actual org policy if different
- **Action Needed:** Confirm 12:30 PM is correct break time

---

## ✅ Recommendations

### Priority 1: Fix Critical Issues
1. [ ] Fix Earned Leave schedule in vercel.json (Issue #1)
2. [ ] Verify carry-forward logic for earned leave (Issue #6)

### Priority 2: Performance Improvements
1. [ ] Increase user limits in morning reminder (Issue #2)
2. [ ] Increase batch size for leave/WFH approvals (Issue #4)

### Priority 3: Polish
1. [ ] Fix checkout reminder icon (Issue #5)
2. [ ] Add carry-forward notification verification
3. [ ] Consider notifications for earned leave (Issue #7)
4. [ ] Confirm half-day cutoff time (Issue #8)

---

## 📊 Overall Assessment

**Cron Logic Quality:** ⭐⭐⭐⭐ (4/5)

### What's Good:
✅ Proper transaction usage (atomicity guaranteed)  
✅ Comprehensive error handling with try-catch  
✅ Duplicate prevention flags on all updates  
✅ Email sending non-blocking (doesn't break notifications)  
✅ Detailed audit logging  
✅ Shared executor between Vercel & node-cron  
✅ IST timezone handling correct in node-cron  
✅ Fallback logic in auto-logout  

### What Needs Fixing:
❌ Earned leave schedule wrong on Vercel  
❌ Hard limits on batch sizes (500, 100)  
❌ Misleading total count reporting  
❌ Missing UI polish (empty icon)  
❌ Carry-forward logic needs clarification  

### Maintenance Notes:
- Keep CronExecution audit table for debugging
- Monitor daily for failed crons
- Test schedule changes carefully on staging first
- Document any policy changes to half-day/carry-forward logic

---

## 🧪 Testing Recommendations

Before deploying fixes:

1. **Local Testing:**
   - Run cron jobs manually via test endpoint
   - Verify database state after each run
   - Check notification creation and audit logs

2. **Staging Verification:**
   - Deploy fixes to staging
   - Trigger each cron manually
   - Wait for actual scheduled runs
   - Verify CronExecution logs

3. **Production Rollout:**
   - Deploy at end of business day (after auto-logout)
   - Monitor CronExecution table
   - Have quick rollback plan ready

