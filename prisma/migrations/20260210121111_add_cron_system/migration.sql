-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_adminId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "eveningReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "morningReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "entityId" DROP NOT NULL,
ALTER COLUMN "adminId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "notificationSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WFHRequest" ADD COLUMN     "notificationSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CronExecution" (
    "id" SERIAL NOT NULL,
    "cronName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronExecution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
