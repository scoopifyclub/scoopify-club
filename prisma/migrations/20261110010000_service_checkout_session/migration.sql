-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "stripeCheckoutSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Service_stripeCheckoutSessionId_key" ON "Service"("stripeCheckoutSessionId");

