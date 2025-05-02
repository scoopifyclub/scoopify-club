# Discounted Initial Cleanup Fee Implementation

## Overview
This document describes how the 50% discounted initial cleanup fee is implemented for new customer signups in ScoopifyClub. It covers backend, frontend, and database details to help future developers and admins understand, maintain, or extend this feature.

---

## Workflow Summary
- **Frontend:**
  - The signup payment page displays a clear order summary showing the initial cleanup fee at 50% off, the first month’s subscription, and the total due today.
- **Backend:**
  - The signup API calculates the discounted cleanup fee and charges the customer for both the first month and the discounted cleanup in a single Stripe payment.
  - A `Service` record is created for the initial cleanup, using the `INITIAL_CLEANUP` ServicePlan from the database for consistency.
- **Database:**
  - The `ServicePlan` table includes a plan with `type: 'INITIAL_CLEANUP'`, seeded at $69.00 (full price).
  - The seed file creates a sample initial cleanup service for the demo customer at the discounted price.

---

## Key Implementation Details
- **ServicePlan**: The plan for initial cleanup is created in the seed file and referenced by type in the backend. Avoid hardcoding IDs elsewhere.
- **Discount Calculation**: The backend applies a 50% discount to the full cleanup fee for new signups.
- **Service Creation**: The initial cleanup job is always tracked as a distinct `Service` with a reference to the correct plan.
- **Error Handling**: If the plan is missing in the database, the API returns a clear error.

---

## Maintenance Checklist
- If you change the price or logic for the initial cleanup, update both the seed file and backend calculation.
- If you rename or remove the `INITIAL_CLEANUP` plan, update all references in the codebase.
- Always keep the seed file and schema in sync with production logic to avoid migration or onboarding issues.

---

## Testing
- Test the signup flow end-to-end after any changes to the pricing or service logic.
- Check the database to ensure the initial cleanup service is created for new customers and references the correct plan.

---

## Contact
For questions, reach out to the engineering team or check the code in `/src/app/api/customer/signup.ts` and `/prisma/seed.js`.
