-- One financial record per completed job (see the JobFinancialRecord comment in
-- schema.prisma and docs/job-completion.md). Amounts are integer cents.

-- CreateTable
CREATE TABLE "JobFinancialRecord" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "servicePlanId" TEXT NOT NULL,
    "pricingBasis" TEXT NOT NULL,
    "planPriceCents" INTEGER NOT NULL,
    "customerPriceCents" INTEGER NOT NULL,
    "scooperEarningCents" INTEGER NOT NULL,
    "referralExpenseCents" INTEGER NOT NULL DEFAULT 0,
    "stripeFeeCents" INTEGER NOT NULL,
    "stripeFeeEstimated" BOOLEAN NOT NULL DEFAULT true,
    "retainedContributionCents" INTEGER NOT NULL,
    "adjustments" JSONB NOT NULL DEFAULT '[]',
    "checkedInAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3) NOT NULL,
    "serviceDurationSeconds" INTEGER,
    "payoutStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeTransferId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobFinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobFinancialRecord_serviceId_key" ON "JobFinancialRecord"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "JobFinancialRecord_stripeTransferId_key" ON "JobFinancialRecord"("stripeTransferId");

-- CreateIndex
CREATE INDEX "JobFinancialRecord_employeeId_payoutStatus_idx" ON "JobFinancialRecord"("employeeId", "payoutStatus");

-- CreateIndex
CREATE INDEX "JobFinancialRecord_customerId_idx" ON "JobFinancialRecord"("customerId");

-- CreateIndex
CREATE INDEX "JobFinancialRecord_completedAt_idx" ON "JobFinancialRecord"("completedAt");

-- AddForeignKey
ALTER TABLE "JobFinancialRecord" ADD CONSTRAINT "JobFinancialRecord_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

