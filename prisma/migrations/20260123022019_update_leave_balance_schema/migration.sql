/*
  Warnings:

  - You are about to drop the column `casualLeave` on the `LeaveBalance` table. All the data in the column will be lost.
  - You are about to drop the column `lossOfPay` on the `LeaveBalance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeaveBalance" DROP COLUMN "casualLeave",
DROP COLUMN "lossOfPay",
ADD COLUMN     "currentYear" INTEGER NOT NULL DEFAULT 2026,
ADD COLUMN     "lastAccrualDate" TIMESTAMP(3),
ADD COLUMN     "leaveUsedInMonth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lossOfPayDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "specialLeave" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ALTER COLUMN "sickLeave" SET DEFAULT 5.0;
