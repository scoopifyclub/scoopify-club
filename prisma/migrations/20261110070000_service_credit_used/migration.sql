-- Marks the visit whose service credit was used, so booking and completion
-- never both use one (src/lib/service-credits.js).

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "creditUsedAt" TIMESTAMP(3);

