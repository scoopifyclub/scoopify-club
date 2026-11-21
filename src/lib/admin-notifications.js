import { sendEmail } from '@/lib/email-service';
import { escapeHtml } from '@/lib/escape-html';
import defaultDb from '@/lib/prisma';

// Admin alerts are best-effort: these helpers log failures and never throw,
// so a broken SMTP setup cannot fail a quote request or a Stripe webhook.

export function adminNotificationAddress() {
    return process.env.ADMIN_EMAIL?.trim() || 'services@scoopify.club';
}

const oneLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

const row = (label, value) => (value === null || value === undefined || value === ''
    ? ''
    : `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`);

const yesNo = (value) => (value ? 'Yes' : 'No');

export async function notifyAdminOfQuote(quote) {
    try {
        const where = [quote.city, quote.state, quote.zipCode].filter(Boolean).join(', ');
        await sendEmail(adminNotificationAddress(), 'custom', {
            subject: oneLine(`New quote request: ${quote.dogCount} dog(s)${where ? ` in ${where}` : ''}`),
            replyTo: quote.contactEmail || undefined,
            html: `
        <h2>New Quote Request</h2>
        ${row('Name', quote.contactName)}
        ${row('Email', quote.contactEmail)}
        ${row('Phone', quote.contactPhone)}
        ${row('Dogs', quote.dogCount)}
        ${row('Service', quote.kind)}
        ${row('Address', [quote.addressLine, quote.city, quote.state, quote.zipCode].filter(Boolean).join(', '))}
        ${row('Unusual yard', yesNo(quote.unusualYard))}
        ${row('Unusual access', yesNo(quote.unusualAccess))}
        ${row('Remote address', yesNo(quote.remoteAddress))}
        ${quote.notes ? `<p><strong>Notes:</strong></p><p style="white-space: pre-wrap;">${escapeHtml(quote.notes)}</p>` : ''}
        ${row('Quote ID', quote.id)}
        <p>Review it in the admin dashboard under Pricing &rarr; Quotes.</p>
      `,
        });
        return true;
    }
    catch (error) {
        console.error(`[admin-notify] Quote ${quote?.id} email failed:`, error?.message);
        return false;
    }
}

export async function notifyAdminOfPaidSignup({ subscriptionId, stripeSubscriptionId, customerId, planId }, { db = defaultDb } = {}) {
    try {
        const customer = customerId ? await db.customer.findUnique({ where: { id: customerId } }) : null;
        const user = customer?.userId ? await db.user.findUnique({ where: { id: customer.userId } }) : null;
        const plan = planId ? await db.servicePlan.findUnique({ where: { id: planId } }) : null;
        const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
        const price = typeof plan?.price === 'number' ? `$${plan.price.toFixed(2)}` : null;

        await sendEmail(adminNotificationAddress(), 'custom', {
            subject: oneLine(`New paid signup: ${name || user?.email || 'customer'}${plan?.name ? ` (${plan.name})` : ''}`),
            replyTo: user?.email || undefined,
            html: `
        <h2>New Paid Signup</h2>
        ${row('Name', name)}
        ${row('Email', user?.email)}
        ${row('Phone', customer?.phone)}
        ${row('Plan', plan?.name)}
        ${row('Price', price)}
        ${row('Customer ID', customerId)}
        ${row('Subscription ID', subscriptionId)}
        ${row('Stripe subscription', stripeSubscriptionId)}
      `,
        });
        return true;
    }
    catch (error) {
        console.error(`[admin-notify] Signup email for subscription ${stripeSubscriptionId} failed:`, error?.message);
        return false;
    }
}
