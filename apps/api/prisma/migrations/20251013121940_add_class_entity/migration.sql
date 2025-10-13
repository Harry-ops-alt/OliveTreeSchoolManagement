-- AlterEnum
ALTER TYPE "AdmissionApplicationStatus" ADD VALUE 'ENROLLED';

-- AlterTable
ALTER TABLE "AdmissionApplication" ADD COLUMN     "enrolledAt" TIMESTAMP(6),
ADD COLUMN     "offerAcceptedAt" TIMESTAMP(6),
ADD COLUMN     "offerSentAt" TIMESTAMP(6),
ADD COLUMN     "reviewStartedAt" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "classroomId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "yearGroup" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Class_branchId_idx" ON "Class"("branchId");

-- CreateIndex
CREATE INDEX "Class_classroomId_idx" ON "Class"("classroomId");

-- CreateIndex
CREATE INDEX "Class_active_branchId_idx" ON "Class"("active", "branchId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
