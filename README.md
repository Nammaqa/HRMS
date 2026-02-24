# 📊 Attendance Management System

A production-ready attendance management system built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL**.

## ✨ Features

✅ **User Authentication**

- Secure JWT-based login/logout
- Role-based access control (Admin & Employee)
- Profile management

✅ **Admin Dashboard**

- User management
- Attendance tracking
- Leave request approvals
- Reports & analytics

✅ **Employee Dashboard**

- Check-in/check-out functionality
- Attendance history
- Leave request system
- Profile editing

✅ **Security**

- Password hashing (bcryptjs)
- JWT token authentication
- HttpOnly secure cookies
- CSRF protection (SameSite)
- Role-based route protection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database

### 1. Clone & Install

```bash
cd attendance
npm install
```

### 2. Configure Environment

Create/edit `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/attendance"

# JWT
JWT_SECRET="change-this-to-a-strong-secret"
JWT_EXPIRES_IN="600m"

# Environment
NODE_ENV="development"
```

### 3. Setup Database

```bash
# Run migrations
npx prisma migrate dev --name init

# Seed test data
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

## 📝 Demo Credentials

### Admin Account

- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Access:** Full system access

### Employee Account

- **Email:** `employee@example.com`
- **Password:** `employee123`
- **Access:** Employee features only

## 📂 Project Structure

```
attendance/
├── app/
│   ├── api/auth/              # Authentication APIs
│   ├── admin/                 # Admin dashboard
│   ├── empolyee/              # Employee dashboard
│   ├── login/                 # Login page
│   └── page.tsx               # Home page
├── components/                # React components
├── lib/                       # Utilities (JWT, Prisma, etc)
├── prisma/                    # Database schema & migrations
├── middleware.ts              # Route protection
├── .env                       # Environment variables
└── package.json               # Dependencies
```

## 🔐 Protected Routes

### Admin Routes (`/admin/*`)

- Dashboard, Users, Attendance, Leave Approvals, Reports

### Employee Routes (`/empolyee/*`)

- Dashboard, Check In/Out, Attendance History, Leaves, Profile

### Public Routes

- `/` - Home page
- `/login` - Login page

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed         # Seed database with test data
npm run lint         # Run ESLint
```

## 📊 Database Models

- **User** - Admin & Employee accounts
- **Attendance** - Check in/out records
- **LeaveRequest** - Leave management
- **LeaveBalance** - Leave tracking
- **AuditLog** - Audit trail

## 🔗 API Endpoints

### Authentication

```
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
GET    /api/auth/me                 - Current user
PUT    /api/auth/update-profile     - Update profile
```

### Admin APIs

```
GET    /api/users                   - List users
POST   /api/users                   - Create user
GET    /api/attendance              - View attendance
GET    /api/leave-requests          - View leave requests
PUT    /api/leave-requests/:id      - Approve/reject
GET    /api/reports                 - Generate reports
```

## 🔒 Security Features

✅ JWT token-based authentication  
✅ Password hashing with bcryptjs  
✅ HttpOnly secure cookies  
✅ CSRF protection (SameSite)  
✅ Role-based access control  
✅ Middleware route protection  
✅ Input validation  
✅ SQL injection prevention (Prisma ORM)

## 📱 Responsive Design

Built with Tailwind CSS for mobile-first responsive design across all devices.

## 🧪 Testing

### Test Admin Access

1. Visit http://localhost:3000
2. Click "Login"
3. Enter: `admin@example.com` / `admin123`
4. Access: http://localhost:3000/admin

### Test Employee Access

1. Visit http://localhost:3000
2. Click "Login"
3. Enter: `employee@example.com` / `employee123`
4. Access: http://localhost:3000/empolyee/dashboard

## 🚨 Important

⚠️ **Before Production:**

1. Change `JWT_SECRET` in `.env`
2. Update database credentials
3. Set `NODE_ENV="production"`
4. Enable HTTPS for secure cookies
5. Review security policies

## 🔧 Technology Stack

**Frontend:**

- React 19
- Next.js 15
- TypeScript
- Tailwind CSS

**Backend:**

- Next.js API Routes
- Prisma ORM
- PostgreSQL

**Security:**

- JWT (jsonwebtoken)
- bcryptjs
- Middleware protection

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Production Status](./PRODUCTION_STATUS.md)

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0

Get started: `npm run dev` 🚀

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Pages

- `/` - Home/Landing page
- `/login` - Login page (email + password)
- `/dashboard` - Dashboard (after login)

## Project Structure

```
attendance/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.ts
```

## Build

```bash
npm run build
npm start
```

## Technologies

- Next.js 15.2
- React 19
- TypeScript 5.7
- Tailwind CSS

to run seed file - npm run seed
"# wizzybox-attendance" 
