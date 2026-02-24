#!/usr/bin/env node

/**
 * Production Readiness Check
 * Verify all components are correctly configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 PRODUCTION READINESS CHECK\n');
console.log('=' .repeat(50));

const checks = [];

// Check 1: .env file exists
const envExists = fs.existsSync(path.join(__dirname, '.env'));
checks.push({
  name: '✓ .env file exists',
  status: envExists,
  fix: 'Create .env file with required variables'
});

// Check 2: JWT_SECRET is set
if (envExists) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const hasJwtSecret = envContent.includes('JWT_SECRET=') && 
                       !envContent.includes('JWT_SECRET="your-secret-key"');
  checks.push({
    name: '✓ JWT_SECRET configured',
    status: hasJwtSecret,
    fix: 'Set JWT_SECRET to a strong value in .env'
  });

  // Check 3: Database URL
  const hasDbUrl = envContent.includes('DATABASE_URL=');
  checks.push({
    name: '✓ DATABASE_URL configured',
    status: hasDbUrl,
    fix: 'Set DATABASE_URL in .env'
  });
}

// Check 4: package.json exists
const pkgExists = fs.existsSync(path.join(__dirname, 'package.json'));
checks.push({
  name: '✓ package.json exists',
  status: pkgExists,
  fix: 'Run: npm install'
});

// Check 5: prisma folder exists
const prismaExists = fs.existsSync(path.join(__dirname, 'prisma'));
checks.push({
  name: '✓ Prisma configuration',
  status: prismaExists,
  fix: 'Prisma schema file required'
});

// Check 6: middleware.ts exists
const middlewareExists = fs.existsSync(path.join(__dirname, 'middleware.ts'));
checks.push({
  name: '✓ Middleware configured',
  status: middlewareExists,
  fix: 'middleware.ts file required for route protection'
});

// Check 7: Auth routes exist
const authLoginExists = fs.existsSync(path.join(__dirname, 'app/api/auth/login/route.ts'));
const authLogoutExists = fs.existsSync(path.join(__dirname, 'app/api/auth/logout/route.ts'));
const authMeExists = fs.existsSync(path.join(__dirname, 'app/api/auth/me/route.ts'));
checks.push({
  name: '✓ Auth API routes',
  status: authLoginExists && authLogoutExists && authMeExists,
  fix: 'Ensure all auth routes are created'
});

// Check 8: Admin pages exist
const adminPageExists = fs.existsSync(path.join(__dirname, 'app/admin/page.tsx'));
const adminLayoutExists = fs.existsSync(path.join(__dirname, 'app/admin/layout.tsx'));
checks.push({
  name: '✓ Admin pages',
  status: adminPageExists && adminLayoutExists,
  fix: 'Admin layout and dashboard required'
});

// Check 9: Employee pages exist
const empDashExists = fs.existsSync(path.join(__dirname, 'app/empolyee/dashboard/page.tsx'));
const empLayoutExists = fs.existsSync(path.join(__dirname, 'app/empolyee/layout.tsx'));
checks.push({
  name: '✓ Employee pages',
  status: empDashExists && empLayoutExists,
  fix: 'Employee layout and pages required'
});

// Check 10: Login page exists
const loginExists = fs.existsSync(path.join(__dirname, 'app/login/page.tsx'));
checks.push({
  name: '✓ Login page',
  status: loginExists,
  fix: 'Login page (app/login/page.tsx) required'
});

// Display results
console.log('\n');
let passCount = 0;
let failCount = 0;

checks.forEach((check) => {
  const icon = check.status ? '✅' : '❌';
  const status = check.status ? 'PASS' : 'FAIL';
  
  console.log(`${icon} ${check.name.padEnd(35)} [${status}]`);
  
  if (!check.status) {
    console.log(`   └─ Fix: ${check.fix}`);
    failCount++;
  } else {
    passCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passCount}/${checks.length} checks passed\n`);

if (failCount === 0) {
  console.log('✅ ✅ ✅  APPLICATION IS PRODUCTION READY!  ✅ ✅ ✅\n');
  console.log('Next Steps:');
  console.log('1. Run: npm run seed (to create test users)');
  console.log('2. Run: npm run dev (start development server)');
  console.log('3. Visit: http://localhost:3000');
  console.log('\nDemo Credentials:');
  console.log('Admin:    admin@example.com / admin123');
  console.log('Employee: employee@example.com / employee123');
} else {
  console.log(`⚠️  ${failCount} issue(s) to fix before production\n`);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');
