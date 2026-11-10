-- Private S3 photo storage: ServicePhoto rows created by the upload path keep
-- the object key (never a public URL) plus what was validated at upload.
-- Legacy rows keep NULLs and their old url.

-- AlterTable
ALTER TABLE "ServicePhoto" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "s3Key" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "uploadedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ServicePhoto_s3Key_key" ON "ServicePhoto"("s3Key");

-- CreateIndex
CREATE INDEX "ServicePhoto_serviceId_idx" ON "ServicePhoto"("serviceId");

-- One earning per completed job, so a repeated or concurrent completion
-- cannot record the scooper's pay twice. This fails if production already has
-- two Earning rows for one service; check first (see docs/job-completion.md).

-- DropIndex
DROP INDEX "Earning_serviceId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Earning_serviceId_key" ON "Earning"("serviceId");
