/*
  Warnings:

  - You are about to drop the column `location` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Classroom` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdmissionLeadStage" AS ENUM ('NEW', 'CONTACTED', 'TASTER_BOOKED', 'ATTENDED', 'OFFER', 'ACCEPTED', 'ENROLLED', 'ONBOARDED');

-- CreateEnum
CREATE TYPE "AdmissionContactChannel" AS ENUM ('CALL', 'EMAIL', 'SMS', 'IN_PERSON', 'NOTE');

-- CreateEnum
CREATE TYPE "AdmissionTasterStatus" AS ENUM ('INVITED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdmissionApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'OFFER_SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AdmissionDecision" AS ENUM ('OFFERED', 'WAITLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdmissionTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropIndex
DROP INDEX "Classroom_branchId_name_key";

-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "classroomId" TEXT;

-- AlterTable
ALTER TABLE "Classroom" DROP COLUMN "location",
DROP COLUMN "notes",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "StaffAssignment" ADD COLUMN     "classroomId" TEXT;

-- CreateTable
CREATE TABLE "AdmissionLead" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "assignedStaffId" TEXT,
    "parentFirstName" TEXT NOT NULL,
    "parentLastName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT,
    "studentFirstName" TEXT,
    "studentLastName" TEXT,
    "studentDateOfBirth" TIMESTAMP(3),
    "programmeInterest" TEXT,
    "preferredContactAt" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "stage" "AdmissionLeadStage" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionLeadContact" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "AdmissionContactChannel" NOT NULL,
    "summary" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AdmissionLeadContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionLeadStageHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStage" "AdmissionLeadStage",
    "toStage" "AdmissionLeadStage" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AdmissionLeadStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTasterSession" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "classroomId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "assignedStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionTasterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTasterAttendee" (
    "id" TEXT NOT NULL,
    "tasterId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "AdmissionTasterStatus" NOT NULL DEFAULT 'INVITED',
    "notes" TEXT,
    "attendedAt" TIMESTAMP(3),

    CONSTRAINT "AdmissionTasterAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "branchId" TEXT,
    "yearGroup" TEXT,
    "requestedStart" TIMESTAMP(3),
    "status" "AdmissionApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "decision" "AdmissionDecision",
    "decisionNotes" TEXT,
    "decisionAt" TIMESTAMP(3),
    "extraData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionOfferLetter" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedById" TEXT,
    "stripeSessionId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AdmissionOfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTask" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "applicationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assigneeId" TEXT,
    "createdById" TEXT,
    "status" "AdmissionTaskStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,

    CONSTRAINT "AdmissionTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionLead_branchId_idx" ON "AdmissionLead"("branchId");

-- CreateIndex
CREATE INDEX "AdmissionLead_assignedStaffId_idx" ON "AdmissionLead"("assignedStaffId");

-- CreateIndex
CREATE INDEX "AdmissionLead_stage_idx" ON "AdmissionLead"("stage");

-- CreateIndex
CREATE INDEX "AdmissionLead_parentEmail_idx" ON "AdmissionLead"("parentEmail");

-- CreateIndex
CREATE INDEX "AdmissionLeadContact_leadId_idx" ON "AdmissionLeadContact"("leadId");

-- CreateIndex
CREATE INDEX "AdmissionLeadContact_userId_idx" ON "AdmissionLeadContact"("userId");

-- CreateIndex
CREATE INDEX "AdmissionLeadStageHistory_leadId_idx" ON "AdmissionLeadStageHistory"("leadId");

-- CreateIndex
CREATE INDEX "AdmissionLeadStageHistory_toStage_idx" ON "AdmissionLeadStageHistory"("toStage");

-- CreateIndex
CREATE INDEX "AdmissionTasterSession_branchId_idx" ON "AdmissionTasterSession"("branchId");

-- CreateIndex
CREATE INDEX "AdmissionTasterSession_classroomId_idx" ON "AdmissionTasterSession"("classroomId");

-- CreateIndex
CREATE INDEX "AdmissionTasterSession_startTime_idx" ON "AdmissionTasterSession"("startTime");

-- CreateIndex
CREATE INDEX "AdmissionTasterAttendee_leadId_idx" ON "AdmissionTasterAttendee"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionTasterAttendee_tasterId_leadId_key" ON "AdmissionTasterAttendee"("tasterId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_leadId_key" ON "AdmissionApplication"("leadId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_branchId_idx" ON "AdmissionApplication"("branchId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_status_idx" ON "AdmissionApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionOfferLetter_applicationId_key" ON "AdmissionOfferLetter"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionOfferLetter_issuedAt_idx" ON "AdmissionOfferLetter"("issuedAt");

-- CreateIndex
CREATE INDEX "AdmissionTask_leadId_idx" ON "AdmissionTask"("leadId");

-- CreateIndex
CREATE INDEX "AdmissionTask_applicationId_idx" ON "AdmissionTask"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionTask_assigneeId_idx" ON "AdmissionTask"("assigneeId");

-- CreateIndex
CREATE INDEX "AdmissionTask_status_idx" ON "AdmissionTask"("status");

-- CreateIndex
CREATE INDEX "AttendanceSession_classroomId_idx" ON "AttendanceSession"("classroomId");

-- CreateIndex
CREATE INDEX "StaffAssignment_classroomId_idx" ON "StaffAssignment"("classroomId");

-- AddForeignKey
ALTER TABLE "AdmissionLead" ADD CONSTRAINT "AdmissionLead_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionLead" ADD CONSTRAINT "AdmissionLead_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionLeadContact" ADD CONSTRAINT "AdmissionLeadContact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AdmissionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionLeadContact" ADD CONSTRAINT "AdmissionLeadContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionLeadStageHistory" ADD CONSTRAINT "AdmissionLeadStageHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AdmissionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionLeadStageHistory" ADD CONSTRAINT "AdmissionLeadStageHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTasterSession" ADD CONSTRAINT "AdmissionTasterSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTasterSession" ADD CONSTRAINT "AdmissionTasterSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTasterSession" ADD CONSTRAINT "AdmissionTasterSession_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTasterAttendee" ADD CONSTRAINT "AdmissionTasterAttendee_tasterId_fkey" FOREIGN KEY ("tasterId") REFERENCES "AdmissionTasterSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTasterAttendee" ADD CONSTRAINT "AdmissionTasterAttendee_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AdmissionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AdmissionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionOfferLetter" ADD CONSTRAINT "AdmissionOfferLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionOfferLetter" ADD CONSTRAINT "AdmissionOfferLetter_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTask" ADD CONSTRAINT "AdmissionTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "AdmissionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTask" ADD CONSTRAINT "AdmissionTask_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTask" ADD CONSTRAINT "AdmissionTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTask" ADD CONSTRAINT "AdmissionTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
