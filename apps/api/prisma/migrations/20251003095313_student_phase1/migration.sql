/*
  Warnings:

  - You are about to drop the column `guardianEmail` on the `StudentProfile` table. All the data in the column will be lost.
  - The `status` column on the `StudentProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[studentNumber]` on the table `StudentProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PROSPECT', 'APPLIED', 'ENROLLED', 'INACTIVE', 'GRADUATED', 'WITHDRAWN', 'ARCHIVED');

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "guardianEmail",
ADD COLUMN     "additionalSupportNotes" TEXT,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "gradeLevel" TEXT,
ADD COLUMN     "homeroom" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medicalNotes" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "primaryLanguage" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "studentNumber" TEXT,
ADD COLUMN     "status_tmp" "StudentStatus";

CREATE TEMP TABLE "_StudentNumberBackfill" AS
SELECT "id", CONCAT('STU-', LPAD((ROW_NUMBER() OVER (ORDER BY "id"))::text, 6, '0')) AS "generatedStudentNumber"
FROM "StudentProfile";

UPDATE "StudentProfile" sp
SET "studentNumber" = COALESCE(sp."studentNumber", sn."generatedStudentNumber")
FROM "_StudentNumberBackfill" sn
WHERE sp."id" = sn."id";

DROP TABLE "_StudentNumberBackfill";

UPDATE "StudentProfile"
SET "status_tmp" =
  CASE "status"
    WHEN 'PENDING' THEN 'APPLIED'
    WHEN 'APPROVED' THEN 'ENROLLED'
    WHEN 'REJECTED' THEN 'ARCHIVED'
    WHEN 'WITHDRAWN' THEN 'WITHDRAWN'
    ELSE 'PROSPECT'
  END::"StudentStatus";

ALTER TABLE "StudentProfile"
ALTER COLUMN "status_tmp" SET DEFAULT 'PROSPECT';

UPDATE "StudentProfile" SET "status_tmp" = COALESCE("status_tmp", 'PROSPECT');

ALTER TABLE "StudentProfile"
ALTER COLUMN "status_tmp" SET NOT NULL;

ALTER TABLE "StudentProfile"
DROP COLUMN "status";

ALTER TABLE "StudentProfile"
RENAME COLUMN "status_tmp" TO "status";

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "contactOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guardian_organizationId_idx" ON "Guardian"("organizationId");

-- CreateIndex
CREATE INDEX "Guardian_branchId_idx" ON "Guardian"("branchId");

-- CreateIndex
CREATE INDEX "StudentGuardian_guardianId_idx" ON "StudentGuardian"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGuardian_studentId_guardianId_key" ON "StudentGuardian"("studentId", "guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentNumber_key" ON "StudentProfile"("studentNumber");

-- CreateIndex
CREATE INDEX "StudentProfile_branchId_gradeLevel_idx" ON "StudentProfile"("branchId", "gradeLevel");

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
