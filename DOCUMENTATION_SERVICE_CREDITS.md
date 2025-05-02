# Service Credits & Depletion System

## Overview
The service credits system ensures that customers can only schedule jobs if they have available credits. Credits are decremented as jobs are completed, and restored when a subscription payment succeeds. If credits run out, the customer is blocked from scheduling new jobs until more credits are purchased or payment is resolved.

## Key Behaviors
- **Decrement on Job Completion:** Each completed job decrements `serviceCredits` by 1 for the customer.
- **Blocking Scheduling:** If `serviceCredits` is 0, the customer cannot schedule new jobs.
- **creditsDepletedAt:**
  - Set to the current date/time when credits first reach zero.
  - Reset to `null` when credits are restored (payment succeeds).
- **Admin Reporting:** Admins can view customers who have had zero credits for more than 14 days (see `/api/admin/credits-report`).

## Testing Checklist
- Complete a job and verify credits decrement.
- Attempt to schedule a job with zero credits (should fail).
- Restore credits and verify `creditsDepletedAt` resets.
- Check the admin report for customers with depleted credits.

---

# Customer Retention Admin Menu

## Purpose
Displays customers with credits depleted for >14 days. Admins can see at-risk customers and follow up for retention.

## Notification Bubble
- Shows the count of at-risk customers.
- Updates dynamically as credits are restored or depleted.

---

# Customer Notification: Failed Payment

## Behavior
- On login, if a customer has zero credits or a failed payment, display a prominent message.
- Provide a button to update payment info or retry payment.
- System will automatically retry failed payments (industry standard: 3–5 attempts over 7–14 days).

---

# Referral System (Planned)

## Goals
- Allow customers, employees, and partners to refer new paying customers.
- Track referrals and pay out valid ones on Fridays (unless Cash App opt-in for same-day work payouts).
- Prevent self-referrals and gaming.
- Provide reporting for all referral payouts and statuses.

## Implementation Steps
- Add referral code field to signup.
- Track and validate referrals.
- Automate payouts and reporting.

---

# QA & Documentation
- Document all flows and logic for the team.
- Write and update tests for all edge cases.

---

# Next Steps
- Test all logic in staging/dev.
- Roll out admin dashboard enhancements and customer notifications.
- Build and launch the referral system.

---

For questions or further documentation, contact the engineering team.
