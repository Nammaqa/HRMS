# 📖 Cron System Documentation Index

## 🎯 Start Here

**New to the cron system?** Start with these in order:

1. **CRON_IMPLEMENTATION_SUMMARY.md** (This file) - Overview of what was built
2. **CRON_SYSTEM.md** - Complete guide with every detail
3. **CRON_QUICK_REFERENCE.md** - Commands and queries you'll use daily
4. **src/cron/INTEGRATION_GUIDE.ts** - How to enable in your app

---

## 📚 Documentation Overview

### 📄 Main Documents

#### [CRON_IMPLEMENTATION_SUMMARY.md](CRON_IMPLEMENTATION_SUMMARY.md)
**What:** Complete implementation summary  
**Length:** ~300 lines  
**When:** Reference after initial setup  
**Covers:**
- File structure created
- What was implemented
- Quick start checklist
- Architecture diagram
- Troubleshooting quick links
- Next steps

#### [CRON_SYSTEM.md](CRON_SYSTEM.md)
**What:** Production documentation (like a service runbook)  
**Length:** ~400 lines  
**When:** Detailed troubleshooting & operations  
**Covers:**
- Complete architecture
- All 4 cron jobs in detail
- Vercel & DigitalOcean deployment
- Environment setup
- Monitoring & debugging
- Database queries
- Troubleshooting section
- Performance targets

#### [CRON_QUICK_REFERENCE.md](CRON_QUICK_REFERENCE.md)
**What:** Quick reference card  
**Length:** ~200 lines  
**When:** While developing/debugging  
**Covers:**
- Common commands
- Useful database queries
- API endpoint testing
- Debugging techniques
- Performance checks
- Common issues & fixes
- Schedules cheat sheet

#### [src/cron/INTEGRATION_GUIDE.ts](src/cron/INTEGRATION_GUIDE.ts)
**What:** How to integrate into your app  
**Length:** ~150 lines  
**When:** Before deploying  
**Covers:**
- 3 integration options
- Root layout example
- Init endpoint example
- PM2 setup example
- Environment checklist
- Verification steps

---

## 🗂️ File Structure

### Source Code (`src/cron/`)

```
src/cron/
├── logic/
│   ├── morning.ts           # Morning reminder (9:30 AM IST)
│   ├── evening.ts           # Evening reminders (8:30 PM IST)
│   ├── autoLogout.ts        # Auto logout (11:59 PM IST)
│   └── earnedLeave.ts       # Monthly accrual (1st, 12:00 AM)
│
├── utils/
│   └── timezone.ts          # IST timezone helpers
│
├── nodeCron.ts              # DigitalOcean node-cron setup
├── executor.ts              # Shared execution engine
├── listeners.ts             # Lifecycle management
├── INTEGRATION_GUIDE.ts      # How to enable crons
├── index.ts (optional)      # Barrel export
│
└── README.md (optional)     # Technical details
```

### API Routes (`app/api/cron/`)

```
app/api/cron/
├── morning-reminder/route.ts    # GET /api/cron/morning-reminder
├── evening-reminder/route.ts    # GET /api/cron/evening-reminder
├── auto-logout/route.ts         # GET /api/cron/auto-logout
├── add-earned-leave/route.ts    # GET /api/cron/add-earned-leave
└── status/route.ts              # GET /api/cron/status
```

### Configuration Files

```
├── vercel.json              # Vercel cron configuration
├── .env.cron.example        # Environment variables template
├── prisma/schema.prisma     # Database schema (UPDATED)
│
├── CRON_SYSTEM.md           # Complete reference
├── CRON_IMPLEMENTATION_SUMMARY.md  # Summary
├── CRON_QUICK_REFERENCE.md  # Quick commands
└── CRON_DOCUMENTATION_INDEX.md (this file)
```

---

## 🔧 Setup Workflow

### Step 1: Database Migration
```bash
# Apply Prisma migration
npx prisma migrate dev --name "add_cron_system"

# Verify
npx prisma studio
```
**Reference:** CRON_SYSTEM.md → Database Migration

### Step 2: Install Dependencies
```bash
npm install node-cron date-fns-tz
```

### Step 3: Configure Environment
```bash
# Copy template
cp .env.cron.example # <-- into your .env

# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update values:
# CRON_MODE=node|vercel
# IS_CRON_MASTER=true|false
# CRON_SECRET=your-secret
```
**Reference:** .env.cron.example

### Step 4: Enable Crons in App
Choose one integration option:
- **Option A:** Root layout (recommended)
- **Option B:** Init endpoint
- **Option C:** PM2 startup script

**Reference:** src/cron/INTEGRATION_GUIDE.ts

### Step 5: Test
```bash
# Check status
curl https://yourdomain.com/api/cron/status

# Test with auth
curl -H "Authorization: Bearer SECRET" \
  https://yourdomain.com/api/cron/morning-reminder
```
**Reference:** CRON_QUICK_REFERENCE.md → Test API Endpoints

---

## 🎯 Cron Jobs Overview

| Job | Time (IST) | Frequency | Purpose |
|-----|-----------|-----------|---------|
| **Morning Reminder** | 9:30 AM | Weekdays | Notify employees to log in |
| **Evening Reminder** | 8:30 PM | Weekdays | Checkout reminder + approval notifications |
| **Auto Logout** | 11:59 PM | Every day | Auto logout forgotten check-ins |
| **Earned Leave** | 12:00 AM | Monthly (1st) | Credit 1.25 days earned leave |

**Full details:** CRON_SYSTEM.md → Cron Jobs section

---

## 🚀 Deployment Guides

### For Vercel (Testing)
1. Push to git: `git push origin main`
2. Set env var in Vercel Dashboard: `CRON_SECRET`
3. Verify: Check Vercel Crons settings

**Full guide:** CRON_SYSTEM.md → Deployment → Vercel

### For DigitalOcean (Production)
1. SSH to server
2. Set environment variables
3. Start with PM2: `pm2 start npm -- start`
4. Verify logs: `pm2 logs | grep CRON`

**Full guide:** CRON_SYSTEM.md → Deployment → DigitalOcean

---

## 🔍 Monitoring

### Dashboard
```bash
curl https://yourdomain.com/api/cron/status
```

### Database Queries
```sql
-- Last 20 executions
SELECT * FROM "CronExecution" ORDER BY "startedAt" DESC LIMIT 20;

-- Success rate
SELECT cronName, status, COUNT(*) FROM "CronExecution"
WHERE "startedAt" > NOW() - INTERVAL '7 days'
GROUP BY cronName, status;

-- Recent failures
SELECT * FROM "CronExecution" WHERE status = 'FAILED' LIMIT 10;
```

**Full guide:** CRON_SYSTEM.md → Monitoring & Debugging

---

## ⚠️ Troubleshooting

### Crons Not Running?
1. Check env variables: `echo $CRON_MODE`
2. Check logs: `pm2 logs | grep CRON`
3. Check database: `CronExecution` table empty?
4. See: CRON_SYSTEM.md → Troubleshooting

### Duplicate Reminders?
1. Check flags: `SELECT "morningReminderSent" FROM "Attendance" WHERE id = 123`
2. Reset (if needed): Update flags to false
3. See: CRON_QUICK_REFERENCE.md → Common Issues

### High Latency?
1. Check execution times: `SELECT cronName, duration FROM "CronExecution"`
2. Analyze queries: `EXPLAIN ANALYZE` on slow queries
3. Add indexes if needed
4. See: CRON_SYSTEM.md → Performance Targets

---

## 💾 Key Database Tables

### CronExecution
Audit trail of cron executions
```sql
SELECT * FROM "CronExecution" ORDER BY "startedAt" DESC;
```

### AuditLog
All system actions (with CRON prefix)
```sql
SELECT * FROM "AuditLog" WHERE "action" LIKE 'MORNING%' OR "action" LIKE 'EVENING%' OR "action" = 'AUTO_LOGOUT';
```

### Notification
All notifications sent (from crons and manual)
```sql
SELECT * FROM "Notification" WHERE "createdAt" > NOW() - INTERVAL '1 day';
```

### Attendance
Updated with reminder flags
```sql
SELECT "morningReminderSent", "eveningReminderSent", COUNT(*) FROM "Attendance" GROUP BY "morningReminderSent", "eveningReminderSent";
```

---

## 🔐 Security

**Important Files:**
- `.env.cron.example` - Never commit real env variables!
- `CRON_SECRET` - Keep secure, rotate periodically
- API Route Authorization - All routes validate Bearer token

**Best Practices:**
1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Never log or expose CRON_SECRET
3. Use different secrets for Vercel vs DigitalOcean
4. Rotate secrets quarterly

**Reference:** CRON_SYSTEM.md → Security section

---

## ✅ Pre-Deployment Checklist

- [ ] Database migration applied
- [ ] node-cron installed
- [ ] date-fns-tz installed
- [ ] Environment variables configured
- [ ] CRON_SECRET generated
- [ ] API routes tested
- [ ] Logs show "[CRON]" entries
- [ ] CronExecution table has entries
- [ ] Notifications appear correctly
- [ ] Status endpoint works

---

## 📞 Quick Links

**By Use Case:**

| Need | Document |
|------|----------|
| Overview | CRON_IMPLEMENTATION_SUMMARY.md |
| Step-by-step setup | CRON_SYSTEM.md (Deployment section) |
| Integration code | src/cron/INTEGRATION_GUIDE.ts |
| Daily operations | CRON_QUICK_REFERENCE.md |
| Troubleshooting | CRON_SYSTEM.md (Troubleshooting section) |
| Database queries | CRON_QUICK_REFERENCE.md (Database Queries) |
| Environment vars | .env.cron.example |
| Technical details | Specific logic file (src/cron/logic/*.ts) |

---

## 🎓 Learning Path

**For Backend Developers:**
1. CRON_IMPLEMENTATION_SUMMARY.md (architecture)
2. src/cron/logic/*.ts (business logic)
3. src/cron/executor.ts (shared interface)
4. app/api/cron/*/route.ts (API routes)

**For DevOps/SRE:**
1. CRON_SYSTEM.md (deployment)
2. CRON_QUICK_REFERENCE.md (operations)
3. .env.cron.example (configuration)
4. CRON_SYSTEM.md (monitoring & debugging)

**For Full Stack:**
1. CRON_IMPLEMENTATION_SUMMARY.md (overview)
2. src/cron/INTEGRATION_GUIDE.ts (how to enable)
3. CRON_QUICK_REFERENCE.md (daily reference)
4. CRON_SYSTEM.md (detailed reference)

---

## 🆘 Emergency Contacts

**If crons are down:**
1. Check: `pm2 logs attendance | grep ERROR`
2. Check: `SELECT * FROM "CronExecution" ORDER BY "startedAt" DESC LIMIT 1;`
3. Check: Environment variables are set
4. Restart: `pm2 restart attendance`

**See:** CRON_SYSTEM.md → Troubleshooting

---

## 📊 System Health

**Monitor at:** `https://yourdomain.com/api/cron/status`

**Response includes:**
- Enabled/disabled status
- Timezone
- Job count
- Recent executions
- 7-day statistics

---

## 🎉 You're All Set!

Everything is implemented and documented. Choose your starting point:

- **Brand new?** → Start with CRON_IMPLEMENTATION_SUMMARY.md
- **Setting up?** → Go to CRON_SYSTEM.md deployment section
- **Need to fix something?** → Check CRON_QUICK_REFERENCE.md
- **Writing integration code?** → Use src/cron/INTEGRATION_GUIDE.ts

---

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** ✅ Production Ready  
**Timezone:** Asia/Kolkata (IST)

📌 Bookmark this file for quick navigation!
