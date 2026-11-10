// Each visit uses at most one of the customer's service credits. The visit's
// creditUsedAt marks that its credit was taken (at booking for one-off
// bookings, otherwise at completion), so the other step skips it.

/**
 * Takes one credit for this visit inside `tx`, unless the visit already used
 * one. Returns 'USED', 'ALREADY_USED', or 'NO_CREDIT' (nothing changed).
 * Credits never go below zero.
 */
export async function useServiceCredit(tx, { serviceId, customerId, now = new Date() }) {
  const { count: marked } = await tx.service.updateMany({
    where: { id: serviceId, creditUsedAt: null },
    data: { creditUsedAt: now },
  });
  if (marked === 0) return 'ALREADY_USED';

  const { count: debited } = await tx.customer.updateMany({
    where: { id: customerId, serviceCredits: { gt: 0 } },
    data: { serviceCredits: { decrement: 1 }, updatedAt: now },
  });
  if (debited === 0) {
    await tx.service.update({ where: { id: serviceId }, data: { creditUsedAt: null } });
    return 'NO_CREDIT';
  }

  await tx.customer.updateMany({
    where: { id: customerId, serviceCredits: 0, creditsDepletedAt: null },
    data: { creditsDepletedAt: now },
  });
  return 'USED';
}
