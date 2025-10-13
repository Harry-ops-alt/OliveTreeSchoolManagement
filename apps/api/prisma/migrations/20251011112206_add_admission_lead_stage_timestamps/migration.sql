/*
  Add canonical admissions stage milestone timestamps and remove legacy columns.
*/

ALTER TABLE "AdmissionLead"
  DROP COLUMN IF EXISTS "tasterBookedAt",
  DROP COLUMN IF EXISTS "offerSentAt",
  DROP COLUMN IF EXISTS "offerAcceptedAt",
  DROP COLUMN IF EXISTS "onboardedAt",
  DROP COLUMN IF EXISTS "stageChangedAt";

ALTER TABLE "AdmissionLead"
  ADD COLUMN IF NOT EXISTS "newAt" TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS "tasterScheduledAt" TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS "appliedAt" TIMESTAMP(6);

ALTER TABLE "AdmissionLead"
  ALTER COLUMN "contactedAt" TYPE TIMESTAMP(6) USING "contactedAt",
  ALTER COLUMN "tasterAttendedAt" TYPE TIMESTAMP(6) USING "tasterAttendedAt",
  ALTER COLUMN "appliedAt" TYPE TIMESTAMP(6) USING "appliedAt",
  ALTER COLUMN "enrolledAt" TYPE TIMESTAMP(6) USING "enrolledAt";
