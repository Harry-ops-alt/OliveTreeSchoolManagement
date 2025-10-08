-- DropIndex
DROP INDEX "Branch_organizationId_idx";

-- AlterTable
ALTER TABLE "AdmissionLead" ADD COLUMN     "isDefaultView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savedById" TEXT,
ADD COLUMN     "savedViewFilters" JSONB,
ADD COLUMN     "savedViewName" TEXT,
ADD COLUMN     "sharedWithOrg" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "AdmissionLead_savedById_idx" ON "AdmissionLead"("savedById");

-- CreateIndex
CREATE INDEX "AdmissionLead_savedViewName_idx" ON "AdmissionLead"("savedViewName");

-- AddForeignKey
ALTER TABLE "AdmissionLead" ADD CONSTRAINT "AdmissionLead_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
