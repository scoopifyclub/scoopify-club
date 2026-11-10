-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT;

-- CreateIndex
CREATE INDEX "Service_status_arrivalDeadline_idx" ON "Service"("status", "arrivalDeadline");

-- One active (claimed or in-progress) job per scooper. Prisma cannot express a
-- partial unique index, so it lives only in this migration; src/lib/job-claims.js
-- relies on it as the last line of defense against concurrent claims.
CREATE UNIQUE INDEX "Service_one_active_job_per_employee"
    ON "Service"("employeeId")
    WHERE "employeeId" IS NOT NULL AND "status" IN ('PENDING', 'IN_PROGRESS');
