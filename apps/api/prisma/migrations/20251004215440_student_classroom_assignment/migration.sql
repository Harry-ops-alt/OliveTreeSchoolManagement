-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "classroomId" TEXT;

-- CreateTable
CREATE TABLE "StudentClassEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classScheduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentClassEnrollment_classScheduleId_idx" ON "StudentClassEnrollment"("classScheduleId");

-- CreateIndex
CREATE INDEX "StudentClassEnrollment_studentId_idx" ON "StudentClassEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentClassEnrollment_studentId_classScheduleId_key" ON "StudentClassEnrollment"("studentId", "classScheduleId");

-- CreateIndex
CREATE INDEX "StudentProfile_classroomId_idx" ON "StudentProfile"("classroomId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentClassEnrollment" ADD CONSTRAINT "StudentClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentClassEnrollment" ADD CONSTRAINT "StudentClassEnrollment_classScheduleId_fkey" FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
