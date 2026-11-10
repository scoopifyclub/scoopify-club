-- Stripe webhook idempotency: event-level dedupe plus one Payment row per
-- Stripe invoice / payment intent.
--
-- The unique indexes fail if production already holds duplicates. Check first:
--   SELECT "stripeInvoiceId", count(*) FROM "Payment" WHERE "stripeInvoiceId" IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
--   SELECT "stripePaymentIntentId", count(*) FROM "Payment" WHERE "stripePaymentIntentId" IS NOT NULL GROUP BY 1 HAVING count(*) > 1;

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "objectId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StripeEvent_objectId_idx" ON "StripeEvent"("objectId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");
