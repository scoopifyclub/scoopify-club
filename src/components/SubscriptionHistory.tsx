'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'REFUNDED';
  date: string;
  type: 'INITIAL_CLEANUP' | 'SUBSCRIPTION' | 'ONE_TIME';
}

interface Subscription {
  id: string;
  priceId: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED';
  startDate: string;
  endDate: string | null;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  paymentHistory: Payment[];
}

interface Customer {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'DO_NOT_SERVICE';
  lastBillingDate: string | null;
  nextBillingDate: string | null;
  initialCleanupCompleted: boolean;
  initialCleanupFeePaid: boolean;
}

interface SubscriptionHistoryProps {
  isAdmin?: boolean;
  customerId: string;
}

export function SubscriptionHistory({ isAdmin = false, customerId }: SubscriptionHistoryProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, [customerId]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/subscription`);
      const data = await response.json();
      setSubscription(data.subscription);
      setCustomer(data.customer);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading subscription history...</div>;
  }

  if (!subscription || !customer) {
    return <div>No subscription data found.</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAST_DUE: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      PAUSED: 'bg-blue-100 text-blue-800',
      DO_NOT_SERVICE: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Subscription Status</h2>
          {getStatusBadge(customer.status)}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Last Billing Date</p>
            <p className="font-medium">
              {customer.lastBillingDate ? format(new Date(customer.lastBillingDate), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Billing Date</p>
            <p className="font-medium">
              {customer.nextBillingDate ? format(new Date(customer.nextBillingDate), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        {!customer.initialCleanupCompleted && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <p className="text-yellow-800">
              Initial cleanup pending. This must be completed before regular service can begin.
            </p>
          </div>
        )}

        {!customer.initialCleanupFeePaid && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              Initial cleanup fee payment pending. This must be paid before service can begin.
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <div className="space-y-4">
          {subscription.paymentHistory.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {getPaymentStatusIcon(payment.status)}
                <div>
                  <p className="font-medium">
                    {payment.type === 'INITIAL_CLEANUP' ? 'Initial Cleanup Fee' : 'Subscription Payment'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(payment.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${payment.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{payment.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isAdmin && (
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              // Implement pause subscription functionality
            }}
          >
            Pause Subscription
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Implement cancel subscription functionality
            }}
          >
            Cancel Subscription
          </Button>
        </div>
      )}
    </div>
  );
} 