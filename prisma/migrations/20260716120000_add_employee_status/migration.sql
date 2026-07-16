CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "User"
ADD COLUMN "employeeStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';