-- AlterTable
ALTER TABLE "AdmissionTasterAttendee" ADD COLUMN     "noShowAt" TIMESTAMP(6),
ADD COLUMN     "reminder24hNotifiedAt" TIMESTAMP(6),
ADD COLUMN     "reminder2hNotifiedAt" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "AdmissionTasterSession" ADD COLUMN     "noShowSweepCompletedAt" TIMESTAMP(6),
ADD COLUMN     "reminder24hScheduledAt" TIMESTAMP(6),
ADD COLUMN     "reminder2hScheduledAt" TIMESTAMP(6);
