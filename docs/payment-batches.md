# Payment Batch System

The payment batch system provides administrators with a streamlined workflow for managing and processing multiple payments to employees and referrers. It allows grouping of payments into logical batches, reviewing them, and processing them together.

## Overview

The payment batch system consists of:
- Database models for managing batches
- API endpoints for batch operations
- Admin dashboard for batch management
- Batch processing functionality supporting multiple payment methods

## Batch States

A payment batch can be in one of the following states:
- `DRAFT`: Initial state for newly created batches
- `PROCESSING`: Batch is currently being processed
- `COMPLETED`: All payments in the batch were successfully processed
- `PARTIAL`: Some payments were processed successfully, but others failed
- `FAILED`: All payments in the batch failed to process

## Database Schema

The system uses the following models:

### PaymentBatch Model

```prisma
model PaymentBatch {
  id                 String    @id @default(cuid())
  name               String
  description        String?
  status             String    // DRAFT, PROCESSING, COMPLETED, PARTIAL, FAILED
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  createdById        String
  createdBy          User      @relation(fields: [createdById], references: [id])
  processingStartedAt DateTime?
  completedAt        DateTime?
  notes              String?
  payments           Payment[]
}
```

### Payment Model Extensions

The Payment model has been extended with the following fields to support batches:

```prisma
model Payment {
  // ... existing fields
  paymentMethod String?
  approvedAt  DateTime?
  approvedBy  String?
  batchId     String?
  batch       PaymentBatch? @relation(fields: [batchId], references: [id])
  // ... other fields
}
```

## API Endpoints

### Batch Management

- `GET /api/admin/payments/batch`: Get all payment batches with pagination and filtering
- `POST /api/admin/payments/batch`: Create a new payment batch
- `GET /api/admin/payments/batch/[batchId]`: Get details of a specific batch
- `PATCH /api/admin/payments/batch/[batchId]`: Update a batch's details
- `DELETE /api/admin/payments/batch/[batchId]`: Delete a batch

### Batch Payments

- `GET /api/admin/payments/batch/[batchId]/payments`: Get all payments in a batch
- `POST /api/admin/payments/batch/[batchId]/payments`: Add payments to a batch
- `DELETE /api/admin/payments/batch/[batchId]/payments`: Remove payments from a batch

### Batch Processing

- `POST /api/admin/payments/batch/[batchId]/process`: Process all payments in a batch

## Admin Dashboard

The admin dashboard provides interfaces for:

1. **Listing Batches**: View all batches with their status, payment count, and total amount
2. **Creating Batches**: Create new batches with name and description
3. **Batch Details**: View batch details, including all payments within the batch
4. **Adding/Removing Payments**: Add approved payments to batches or remove them
5. **Processing Batches**: Process all payments in a batch using a selected payment method

## Payment Methods

The batch processing system supports the following payment methods:

- **Stripe**: Automated transfers to connected Stripe accounts
- **Cash App**: Manual payments via Cash App (system records the payment)
- **Cash**: Manual cash payments (system records the payment)
- **Check**: Manual check payments (system records the payment)

## Audit and Reconciliation

Payment batches integrate with the existing payment audit system. The following events are logged:
- Batch creation
- Adding/removing payments to/from batches
- Batch processing 
- Payment status changes

## Workflow Example

1. Administrator creates a new payment batch (e.g., "Weekly Referral Payments - July 1-7")
2. Administrator adds approved payments to the batch
3. Administrator reviews the batch details and payments
4. Administrator processes the batch, selecting a payment method
5. System attempts to process each payment and updates their status
6. System updates the batch status based on the processing results
7. Administrator can view processing results and handle any failed payments

## Permissions

Only users with the `ADMIN` role can access and manage payment batches. 