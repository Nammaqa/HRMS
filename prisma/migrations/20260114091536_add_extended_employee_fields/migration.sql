/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aadharNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[panCard]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bankAccountNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uanNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pfNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
ADD COLUMN     "aadharNumber" TEXT,
ADD COLUMN     "alternateContact" TEXT,
ADD COLUMN     "assetDetails" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankHolderName" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bgvProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "citizenship" TEXT,
ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "dateOfDeployment" TIMESTAMP(3),
ADD COLUMN     "dateOfExit" TIMESTAMP(3),
ADD COLUMN     "dateOfJoining" TIMESTAMP(3),
ADD COLUMN     "dateOfMarriage" TIMESTAMP(3),
ADD COLUMN     "designationAtCompany" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "idCardProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "laptopProvider" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "masterDegree" TEXT,
ADD COLUMN     "masterPercentage" DOUBLE PRECISION,
ADD COLUMN     "masterYOP" INTEGER,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "panCard" TEXT,
ADD COLUMN     "permanentAddress" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "pfNumber" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "previousCompany" TEXT,
ADD COLUMN     "projectClient" TEXT,
ADD COLUMN     "secondaryDegree" TEXT,
ADD COLUMN     "secondaryPercentage" DOUBLE PRECISION,
ADD COLUMN     "secondaryYOP" INTEGER,
ADD COLUMN     "tenthDegree" TEXT,
ADD COLUMN     "tenthPercentage" DOUBLE PRECISION,
ADD COLUMN     "tenthYOP" INTEGER,
ADD COLUMN     "totalExperience" DOUBLE PRECISION,
ADD COLUMN     "twelfthDegree" TEXT,
ADD COLUMN     "twelfthPercentage" DOUBLE PRECISION,
ADD COLUMN     "twelfthYOP" INTEGER,
ADD COLUMN     "uanNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_aadharNumber_key" ON "User"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_panCard_key" ON "User"("panCard");

-- CreateIndex
CREATE UNIQUE INDEX "User_bankAccountNumber_key" ON "User"("bankAccountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_uanNumber_key" ON "User"("uanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_pfNumber_key" ON "User"("pfNumber");
