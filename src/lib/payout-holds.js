import { prisma as defaultDb } from '@/lib/prisma';
import { applyHolds, voidServiceEarning } from '@/lib/scooper-payouts';

// Refund and dispute policy for scooper pay:
// - A full refund of a payment tied to one service voids that job's pay
//   (clawed back from the next payout if it was already paid).
// - Any other refund (partial, or a subscription invoice that covers several
//   visits) and every open dispute put a hold on the customer: none of that
//   customer's unpaid jobs are paid until it is resolved.
// - A dispute that is won releases its hold. A lost dispute voids the job
//   when the payment was tied to one service; otherwise the hold stays open
//   for an admin to release it or void specific jobs.

async function findChargeOwner(db, { paymentIntentId, stripeCustomerId, chargeId, stripe }) {
  const payment = paymentIntentId
    ? await db.payment.findFirst({ where: { stripePaymentIntentId: paymentIntentId }, select: { customerId: true, serviceId: true } })
    : null;
  let customerId = payment?.customerId || null;
  let customerStripeId = stripeCustomerId;
  if (!customerId && !customerStripeId && chargeId && stripe) {
    const charge = await stripe.charges.retrieve(chargeId);
    customerStripeId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
  }
  if (!customerId && customerStripeId) {
    customerId = (await db.customer.findUnique({ where: { stripeCustomerId: customerStripeId }, select: { id: true } }))?.id || null;
  }
  return { customerId, serviceId: payment?.serviceId || null };
}

const idOf = (value) => (typeof value === 'string' ? value : value?.id || null);

/** charge.dispute.created / charge.dispute.updated / charge.dispute.closed */
export async function handleDispute(dispute, { db = defaultDb, stripe, now = new Date() } = {}) {
  const owner = await findChargeOwner(db, {
    paymentIntentId: idOf(dispute.payment_intent),
    chargeId: idOf(dispute.charge),
    stripe,
  });
  const existing = await db.payoutHold.findUnique({ where: { stripeObjectId: dispute.id } });
  const hold = existing || await db.payoutHold.upsert({
    where: { stripeObjectId: dispute.id },
    create: {
      reason: 'DISPUTE',
      status: 'OPEN',
      customerId: owner.customerId,
      serviceId: owner.serviceId,
      stripeObjectId: dispute.id,
      stripeChargeId: idOf(dispute.charge),
      amount: dispute.amount != null ? dispute.amount / 100 : null,
      note: owner.customerId ? null : 'No matching customer found; nothing is held.',
    },
    update: {},
  });

  let outcome = { holdId: hold.id, status: hold.status };
  if (hold.status === 'OPEN' && ['won', 'warning_closed'].includes(dispute.status)) {
    await db.payoutHold.update({
      where: { id: hold.id },
      data: { status: 'RELEASED', resolvedAt: now, resolvedBy: 'stripe', note: `Dispute ${dispute.status}` },
    });
    outcome = { holdId: hold.id, status: 'RELEASED' };
  } else if (hold.status === 'OPEN' && dispute.status === 'lost') {
    if (hold.serviceId) {
      const voided = await voidServiceEarning({ db, serviceId: hold.serviceId, reason: `DISPUTE_LOST:${hold.id}`, now });
      await db.payoutHold.update({
        where: { id: hold.id },
        data: { status: 'RESOLVED', resolvedAt: now, resolvedBy: 'stripe', note: 'Dispute lost; job pay voided' },
      });
      outcome = { holdId: hold.id, status: 'RESOLVED', voided: [voided] };
    } else {
      await db.payoutHold.update({
        where: { id: hold.id },
        data: { note: 'Dispute lost. An admin must void the affected jobs or release the hold.' },
      });
    }
  }
  await applyHolds({ db, now });
  return outcome;
}

/** charge.refunded (sent for every full or partial refund of a charge). */
export async function handleChargeRefunded(charge, { db = defaultDb, now = new Date() } = {}) {
  const owner = await findChargeOwner(db, {
    paymentIntentId: idOf(charge.payment_intent),
    stripeCustomerId: idOf(charge.customer),
  });
  const amount = (charge.amount_refunded || 0) / 100;
  const fullRefund = Boolean(charge.refunded) || charge.amount_refunded >= charge.amount;
  const key = `refund:${charge.id}`;

  if (fullRefund && owner.serviceId) {
    const voided = await voidServiceEarning({ db, serviceId: owner.serviceId, reason: `REFUND:${charge.id}`, now });
    const hold = await db.payoutHold.upsert({
      where: { stripeObjectId: key },
      create: {
        reason: 'REFUND', status: 'RESOLVED', customerId: owner.customerId, serviceId: owner.serviceId,
        stripeObjectId: key, stripeChargeId: charge.id, amount, resolvedAt: now, resolvedBy: 'stripe',
        note: 'Full refund of a single-service payment; job pay voided',
      },
      update: { status: 'RESOLVED', amount, resolvedAt: now, resolvedBy: 'stripe' },
    });
    await applyHolds({ db, now });
    return { holdId: hold.id, status: 'RESOLVED', voided: [voided] };
  }

  const existing = await db.payoutHold.findUnique({ where: { stripeObjectId: key } });
  let hold;
  if (!existing) {
    hold = await db.payoutHold.create({
      data: {
        reason: 'REFUND', status: 'OPEN', customerId: owner.customerId, serviceId: null,
        stripeObjectId: key, stripeChargeId: charge.id, amount,
        note: owner.customerId ? 'Refund needs review: release the hold or void the refunded jobs.' : 'No matching customer found; nothing is held.',
      },
    });
  } else if (existing.amount !== amount) {
    // A further refund on the same charge reopens the review.
    hold = await db.payoutHold.update({
      where: { id: existing.id },
      data: { amount, status: 'OPEN', resolvedAt: null, resolvedBy: null },
    });
  } else {
    hold = existing;
  }
  await applyHolds({ db, now });
  return { holdId: hold.id, status: hold.status };
}

/**
 * Admin decision on a hold. `release` lets the held jobs be paid; `void`
 * voids (or claws back) the given services, or every job the hold currently
 * covers when none are given, and closes the hold.
 */
export async function resolveHold({ db = defaultDb, holdId, action, serviceIds, adminId, note, now = new Date() }) {
  const hold = await db.payoutHold.findUnique({ where: { id: holdId } });
  if (!hold) return { error: 'Hold not found', status: 404 };
  if (!['release', 'void'].includes(action)) return { error: 'action must be release or void', status: 400 };

  let voided = [];
  if (action === 'void') {
    let targets = Array.isArray(serviceIds) && serviceIds.length ? serviceIds : null;
    if (!targets) {
      targets = hold.serviceId
        ? [hold.serviceId]
        : (await db.jobFinancialRecord.findMany({
            where: { payoutStatus: 'HELD', holdReason: `${hold.reason}:${hold.id}` },
            select: { serviceId: true },
          })).map((r) => r.serviceId);
    }
    if (hold.customerId) {
      const owned = await db.service.findMany({ where: { id: { in: targets }, customerId: hold.customerId }, select: { id: true } });
      const allowed = new Set(owned.map((s) => s.id));
      const foreign = targets.filter((id) => !allowed.has(id));
      if (foreign.length) return { error: `Services not owned by this hold's customer: ${foreign.join(', ')}`, status: 400 };
    }
    for (const serviceId of targets) {
      voided.push(await voidServiceEarning({ db, serviceId, reason: `${hold.reason}_VOIDED:${hold.id}`, by: adminId || 'admin', now }));
    }
  }

  const updated = await db.payoutHold.update({
    where: { id: hold.id },
    data: {
      status: action === 'release' ? 'RELEASED' : 'RESOLVED',
      resolvedAt: now,
      resolvedBy: adminId || 'admin',
      ...(note ? { note } : {}),
    },
  });
  await applyHolds({ db, now });
  return { hold: updated, voided };
}
