# Payment Batch System

The Payment Batch System is a robust solution for managing employee earnings and referral payments efficiently. This system enables administrators to review, approve, and process multiple payments simultaneously.

## Overview

The batch payment workflow consists of these key stages:

1. **Creating a Batch**: Administrators create a new payment batch and select payments to include
2. **Reviewing**: Admins review the batch details including payment recipients and amounts
3. **Approving**: Admins approve payments in the batch to prepare them for processing
4. **Processing**: Approved payments are processed through selected payment methods
5. **Completion**: The system records payment details and updates payment statuses

## Batch Statuses

Payment batches can have the following statuses:

- **DRAFT**: Initial status when a batch is created and payments are being added
- **PROCESSING**: Batch is currently being processed
- **COMPLETED**: All payments in the batch were successfully processed
- **PARTIALLY_COMPLETED**: Some payments were processed successfully, but others failed
- **FAILED**: None of the payments in the batch could be processed

## Payment Methods

The system supports multiple payment methods:

- **Stripe**: Direct transfers to recipient's connected Stripe account
- **Cash App**: Payment via Cash App to recipient's username
- **Cash**: Manual cash payments
- **Check**: Payment via physical check

## Creating a Payment Batch

1. Navigate to the Admin Dashboard > Payments
2. Click "Create Batch"
3. Enter a name and description for the batch
4. Select either "Earnings" or "Referrals" as the payment type
5. Add payments by selecting from the list of approved payments
6. Review and save the batch as a draft

## Approving Payments

1. From the Payment Batches page, select a batch in DRAFT status
2. Review all payments in the batch
3. Select payments to approve
4. Click "Approve Selected"
5. Confirm the approval action

## Processing Payments

1. From the Payment Batches page, select a batch with approved payments
2. Choose the payment method (Stripe, Cash App, Cash, or Check)
3. Click "Process Batch"
4. Review the processing results
5. Handle any failed payments

## Payment Processing Logic

### Stripe Payments
- Requires recipients to have connected Stripe accounts
- System automatically creates transfers to recipient accounts
- Transaction IDs are recorded for audit purposes
- Fees are deducted from the recipient's amount

### Cash App Payments
- Requires recipients to have registered Cash App usernames
- System marks payments as ready for Cash App processing
- Admin must manually complete the Cash App transfers

### Cash and Check Payments
- System marks payments as ready for manual processing
- Admin must physically distribute cash or checks to recipients

## Error Handling

The system provides robust error handling:
- Failed payments are clearly marked
- Detailed error messages are logged
- Admins can retry failed payments
- Batch status is updated to reflect partial completions

## Audit Logging

All payment activities are logged for audit purposes:
- Payment approval events
- Processing attempts
- Status changes
- Admin actions

## API Endpoints

### Batch Management
- `GET /api/admin/payments/batch` - List all batches
- `POST /api/admin/payments/batch` - Create a new batch
- `GET /api/admin/payments/batch/[batchId]` - Get batch details
- `PUT /api/admin/payments/batch/[batchId]` - Update batch details
- `DELETE /api/admin/payments/batch/[batchId]` - Delete a batch (draft only)

### Batch Payments
- `GET /api/admin/payments/batch/[batchId]/payments` - List payments in a batch
- `POST /api/admin/payments/batch/[batchId]/payments` - Add payments to a batch
- `DELETE /api/admin/payments/batch/[batchId]/payments` - Remove payments from a batch

### Batch Processing
- `POST /api/admin/payments/batch/[batchId]/approve` - Approve payments in a batch
- `POST /api/admin/payments/batch/[batchId]/process` - Process a batch with specified payment method

## Best Practices

1. **Regular Processing**: Process payments on a consistent schedule (weekly or bi-weekly)
2. **Thorough Review**: Always review payment details before approval
3. **Method Selection**: Use the payment method preferred by each recipient
4. **Record Keeping**: Maintain detailed records of all manual payments
5. **Error Resolution**: Address failed payments promptly 