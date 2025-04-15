'use client';

import { FailedPaymentsDashboard } from '@/components/FailedPaymentsDashboard';
import { Card } from '@/components/ui/card';

export default function FailedPaymentsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Failed Payments Management</h1>
        <p className="text-gray-500 mt-2">
          View and manage failed payments, retry attempts, and customer statuses
        </p>
      </div>

      <Card className="p-6">
        <FailedPaymentsDashboard />
      </Card>
    </div>
  );
} 