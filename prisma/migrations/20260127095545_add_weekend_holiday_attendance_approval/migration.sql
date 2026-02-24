-- CreateTable
CREATE TABLE "WeekendHolidayAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayType" TEXT NOT NULL,
    "holidayName" TEXT,
    "loginTime" TIMESTAMP(3) NOT NULL,
    "logoutTime" TIMESTAMP(3),
    "loginLatitude" DOUBLE PRECISION,
    "loginLongitude" DOUBLE PRECISION,
    "logoutLatitude" DOUBLE PRECISION,
    "logoutLongitude" DOUBLE PRECISION,
    "totalWorkingHours" DOUBLE PRECISION,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvalReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekendHolidayAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeekendHolidayAttendance_status_idx" ON "WeekendHolidayAttendance"("status");

-- CreateIndex
CREATE INDEX "WeekendHolidayAttendance_userId_idx" ON "WeekendHolidayAttendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeekendHolidayAttendance_userId_date_key" ON "WeekendHolidayAttendance"("userId", "date");

-- AddForeignKey
ALTER TABLE "WeekendHolidayAttendance" ADD CONSTRAINT "WeekendHolidayAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
