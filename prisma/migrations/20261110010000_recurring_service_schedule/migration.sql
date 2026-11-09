-- Recurring visits: link each generated Service to its Subscription and to the
-- Denver calendar date it was generated for. serviceDate never changes when a
-- visit is rolled over or rescheduled, so the unique key keeps a re-run of the
-- scheduler from creating the same visit twice. Existing rows get NULLs, which
-- Postgres treats as distinct, so the index applies cleanly to current data.

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "serviceDate" DATE,
ADD COLUMN     "subscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Service_subscriptionId_serviceDate_key" ON "Service"("subscriptionId", "serviceDate");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
