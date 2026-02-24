# 🚀 Cron System - Quick Reference Card

## 🎯 Commands

### Setup & Installation
```bash
# Install dependencies
npm install node-cron date-fns-tz

# Run database migration
npx prisma migrate dev --name "add_cron_system"

# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# View database
npx prisma studio
```

### DigitalOcean (Production)
```bash
# SSH to server
ssh root@your-server-ip

# Set environment variables
export CRON_MODE=node
export IS_CRON_MASTER=true
export CRON_SECRET=your-secret-key

# Start with PM2
pm2 start npm --name "attendance" -- start
pm2 logs attendance | grep CRON

# Monitor status
curl https://yourdomain.com/api/cron/status
```

### Vercel (Testing)
```bash
# Deploy
git push origin main

# Set in Vercel Dashboard:
# CRON_SECRET=your-secret-key

# Monitor
vercel logs --follow
```

---

## 📊 Database Queries

### Check Cron Executions
```sql
SELECT * FROM "CronExecution" 
ORDER BY "startedAt" DESC 
LIMIT 20;
```

### Check Recent Failures
```sql
SELECT * FROM "CronExecution"
WHERE status = 'FAILED'
ORDER BY "startedAt" DESC
LIMIT 10;
```

### Check Cron Actions
```sql
SELECT * FROM "AuditLog"
WHERE "action" IN ('MORNING_REMINDER_SENT', 'EVENING_REMINDER_SENT', 
                    'AUTO_LOGOUT', 'EARNED_LEAVE_ACCRUAL')
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Cron Success Rate (Last 7 Days)
```sql
SELECT cronName, status, COUNT(*) as count
FROM "CronExecution"
WHERE "startedAt" > NOW() - INTERVAL '7 days'
GROUP BY cronName, status
ORDER BY cronName, status;
```

### Check Notifications Sent
```sql
SELECT COUNT(*) as total,
       COUNT(CASE WHEN type = 'ALERT' THEN 1 END) as alerts,
       COUNT(CASE WHEN type = 'SUCCESS' THEN 1 END) as approvals
FROM "Notification"
WHERE "createdAt" > NOW() - INTERVAL '1 day';
```

---

## 🧪 Test API Endpoints

### With Authentication
```bash
# Set SECRET first
CRON_SECRET="your-secret-key"

# Morning Reminder
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.com/api/cron/morning-reminder

# Evening Reminder
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.com/api/cron/evening-reminder

# Auto Logout
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.com/api/cron/auto-logout

# Earned Leave
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://yourdomain.com/api/cron/add-earned-leave

# Check Status
curl https://yourdomain.com/api/cron/status
```

### Verify Authorization Works
```bash
# Should get 401 Unauthorized
curl https://yourdomain.com/api/cron/morning-reminder

# Parse response
curl -s https://yourdomain.com/api/cron/status | jq '.'
```

---

## 🔍 Debugging

### Check if Cron is Running (DigitalOcean)
```bash
# View recent logs with CRON tag
pm2 logs attendance | grep CRON

# Or just see the last 20 lines
pm2 logs attendance | tail -20

# Get full status
pm2 status

# View specific process
pm2 show attendance
```

### Check Environment Variables
```bash
# DigitalOcean
echo $CRON_MODE
echo $IS_CRON_MASTER
echo $CRON_SECRET | head -c 10}...  # Don't print full secret!
```

### Check Cron Jobs Scheduled
```bash
# See what node-cron has scheduled
# Check logs for: "[CRON] Scheduling ..."
pm2 logs attendance | grep "Scheduling"
```

### Test Database Connection
```bash
# Open Prisma Studio
npx prisma studio

# Or test connection directly
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRaw\`SELECT 1\`.then(() => console.log('Connected!')).catch(e => console.error(e))"
```

---

## 📈 Performance Check

### Execution Times
```sql
-- Average execution time by cron
SELECT cronName, 
       COUNT(*) as executions,
       ROUND(AVG(EXTRACT(EPOCH FROM ("finishedAt" - "startedAt")))) as avg_sec,
       MAX(EXTRACT(EPOCH FROM ("finishedAt" - "startedAt"))) as max_sec
FROM "CronExecution"
WHERE "startedAt" > NOW() - INTERVAL '7 days'
  AND "finishedAt" IS NOT NULL
GROUP BY cronName
ORDER BY avg_sec DESC;
```

### Success Rate
```sql
-- Success rate by cron (last 7 days)
SELECT cronName,
       COUNT(*) as total,
       SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
       ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*)) as success_rate
FROM "CronExecution"
WHERE "startedAt" > NOW() - INTERVAL '7 days'
GROUP BY cronName
ORDER BY success_rate DESC;
```

---

## ⚠️ Common Issues & Fixes

### Crons Not Running
```bash
# Check these in order:
1. echo $CRON_MODE | grep "node"
2. echo $IS_CRON_MASTER | grep "true"
3. pm2 logs attendance | grep ERROR
4. npx prisma migrate status
```

### Duplicate Reminders
```sql
-- Check flags:
SELECT id, "morningReminderSent", "eveningReminderSent" 
FROM "Attendance" 
WHERE date = CURRENT_DATE
LIMIT 5;

-- Reset if needed (careful!):
UPDATE "Attendance" 
SET "morningReminderSent" = false 
WHERE "morningReminderSent" = true AND date = CURRENT_DATE;
```

### High Execution Time
```sql
-- Find slow executions:
SELECT * FROM "CronExecution"
WHERE EXTRACT(EPOCH FROM ("finishedAt" - "startedAt")) > 5
ORDER BY "startedAt" DESC;

-- Check database size:
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Authorization Failures
```bash
# Verify secret is set:
curl -I https://yourdomain.com/api/cron/status

# Check header format:
curl -v -H "Authorization: Bearer your-secret" \
  https://yourdomain.com/api/cron/morning-reminder

# Or test with curl verbose:
curl -H "Authorization: Bearer invalid-secret" \
  https://yourdomain.com/api/cron/morning-reminder 2>&1 | grep "401"
```

---

## 📋 Schedules (Cheat Sheet)

### DigitalOcean (IST)
| Job | Time | Cron |
|-----|------|------|
| Morning Reminder | 9:30 AM | `30 9 * * 1-5` |
| Evening Reminder | 8:30 PM | `30 20 * * 1-5` |
| Auto Logout | 11:59 PM | `59 23 * * *` |
| Earned Leave | 12:00 AM (1st) | `0 0 1 * *` |

### Vercel (UTC)
| Job | UTC Time | Cron |
|-----|----------|------|
| Morning Reminder | 4:00 AM | `0 4 * * *` |
| Evening Reminder | 3:00 PM | `0 15 * * *` |
| Auto Logout | 6:29 PM | `29 18 * * *` |
| Earned Leave | 12:00 AM (1st) | `0 0 1 * *` |

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Database migration applied (`npx prisma migrate deploy`)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] CRON_SECRET generated and secured
- [ ] API routes tested manually
- [ ] Logs reviewed for errors

### Post-Deployment (First 24 Hours)
- [ ] Check `/api/cron/status` endpoint
- [ ] Verify morning reminder executed
- [ ] Verify evening reminder executed
- [ ] Check `CronExecution` table for entries
- [ ] Verify notifications created
- [ ] Monitor logs for errors

### Ongoing (Weekly)
- [ ] Review `/api/cron/status`
- [ ] Check `CronExecution` success rate
- [ ] Review `AuditLog` for issues
- [ ] Monitor execution times
- [ ] Check for failed executions

---

## 📞 Quick Support

**Documentation:** See [CRON_SYSTEM.md](CRON_SYSTEM.md)  
**Integration:** See [src/cron/INTEGRATION_GUIDE.ts](src/cron/INTEGRATION_GUIDE.ts)  
**Summary:** See [CRON_IMPLEMENTATION_SUMMARY.md](CRON_IMPLEMENTATION_SUMMARY.md)

---

**Print & Bookmark This Card!** 📌

Last Updated: February 2026 | Timezone: Asia/Kolkata (IST)
