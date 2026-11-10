-- Scooper payouts through Stripe Connect transfers (docs/scooper-payouts.md).
--
-- JobFinancialRecord (one per completed job) is the payout ledger: each record
-- is attached to at most one weekly Payout, and Payout is unique per scooper
-- per week, so a re-run of the payout cron finds the existing row instead of
-- paying again. One weekly transfer covers several records, so the record's
-- stripeTransferId is no longer unique. PayoutAdjustment carries clawbacks of
-- jobs that were refunded after they were paid; PayoutHold keeps pay back
-- while a refund or dispute is open. The Payout unique index fails loudly if
-- production already has two Payout rows for one scooper and weekStart (NULL
-- weekStart rows are unaffected).

-- DropIndex
DROP INDEX "JobFinancialRecord_stripeTransferId_key";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "stripeAccountUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JobFinancialRecord" ADD COLUMN     "holdReason" TEXT,
ADD COLUMN     "payoutId" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "stripeTransferId" TEXT;

-- CreateTable
CREATE TABLE "PayoutAdjustment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "serviceId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payoutId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutHold" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "customerId" TEXT,
    "serviceId" TEXT,
    "stripeObjectId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "amount" DOUBLE PRECISION,
    "note" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutAdjustment_key_key" ON "PayoutAdjustment"("key");

-- CreateIndex
CREATE INDEX "PayoutAdjustment_employeeId_status_idx" ON "PayoutAdjustment"("employeeId", "status");

-- CreateIndex
CREATE INDEX "PayoutAdjustment_payoutId_idx" ON "PayoutAdjustment"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutHold_stripeObjectId_key" ON "PayoutHold"("stripeObjectId");

-- CreateIndex
CREATE INDEX "PayoutHold_status_idx" ON "PayoutHold"("status");

-- CreateIndex
CREATE INDEX "PayoutHold_customerId_idx" ON "PayoutHold"("customerId");

-- CreateIndex
CREATE INDEX "PayoutHold_serviceId_idx" ON "PayoutHold"("serviceId");

-- CreateIndex
CREATE INDEX "JobFinancialRecord_stripeTransferId_idx" ON "JobFinancialRecord"("stripeTransferId");

-- CreateIndex
CREATE INDEX "JobFinancialRecord_payoutId_idx" ON "JobFinancialRecord"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripeTransferId_key" ON "Payout"("stripeTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_employeeId_weekStart_key" ON "Payout"("employeeId", "weekStart");

-- AddForeignKey
ALTER TABLE "JobFinancialRecord" ADD CONSTRAINT "JobFinancialRecord_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutAdjustment" ADD CONSTRAINT "PayoutAdjustment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
