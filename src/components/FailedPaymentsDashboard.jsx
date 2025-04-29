'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';

/**
 * @typedef {Object} Payment
 * @property {string} id - The unique identifier of the payment
 * @property {number} amount - The payment amount
 * @property {string} date - The payment date
 * @property {string} status - The payment status
 * @property {string} type - The payment type
 */

/**
 * @typedef {Object} Customer
 * @property {string} id - The unique identifier of the customer
 * @property {string} name - The customer's name
 * @property {string} email - The customer's email
 * @property {string} phone - The customer's phone number
 */

/**
 * @typedef {Object} Subscription
 * @property {string} id - The unique identifier of the subscription
 * @property {string} status - The subscription status
 * @property {string} startDate - The subscription start date
 * @property {string|null} endDate - The subscription end date
 */

/**
 * @typedef {Object} FailedPayment
 * @property {Payment} payment - The failed payment details
 * @property {Customer} customer - The customer details
 * @property {Subscription} subscription - The subscription details
 * @property {number} retryAttempts - Number of retry attempts
 * @property {string|null} nextRetryDate - The next retry date
 */

/**
 * FailedPaymentsDashboard component for displaying and managing failed payments
 * @returns {JSX.Element} The rendered component
 */
export function FailedPaymentsDashboard() {
    const [failedPayments, setFailedPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchFailedPayments();
    }, []);
    const fetchFailedPayments = async () => {
        try {
            const response = await fetch('/api/admin/failed-payments');
            const data = await response.json();
            setFailedPayments(data);
        }
        catch (error) {
            console.error('Error fetching failed payments:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCancelRetry = async (paymentId) => {
        try {
            await fetch(`/api/admin/payments/${paymentId}/cancel-retry`, {
                method: 'POST',
            });
            fetchFailedPayments(); // Refresh the list
        }
        catch (error) {
            console.error('Error cancelling retry:', error);
        }
    };
    const getStatusBadge = (status) => {
        const variants = {
            PAST_DUE: 'bg-yellow-100 text-yellow-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
            ACTIVE: 'bg-green-100 text-green-800',
        };
        return (<Badge className={variants[status]}>
        {status.replace('_', ' ')}
      </Badge>);
    };
    if (loading) {
        return <div>Loading failed payments...</div>;
    }
    return (<div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Failed Payments</h2>
        <Button onClick={fetchFailedPayments}>Refresh</Button>
      </div>

      <div className="grid gap-6">
        {failedPayments.map((item) => (<Card key={item.payment.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{item.customer.name}</h3>
                <p className="text-sm text-gray-500">{item.customer.email}</p>
                <p className="text-sm text-gray-500">{item.customer.phone}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(item.subscription.status)}
                <Button variant="outline" size="sm" onClick={() => handleCancelRetry(item.payment.id)}>
                  Cancel Retry
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Payment Amount</p>
                <p className="font-medium">${item.payment.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Failed Date</p>
                <p className="font-medium">
                  {format(new Date(item.payment.date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Retry Attempts</p>
                <p className="font-medium">{item.retryAttempts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Retry</p>
                <p className="font-medium">
                  {item.nextRetryDate
                ? format(new Date(item.nextRetryDate), 'MMM d, yyyy')
                : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4"/>
              <span>
                Payment will be retried automatically until cancelled or successful
              </span>
            </div>
          </Card>))}

        {failedPayments.length === 0 && (<div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4"/>
            <p className="text-lg font-medium">No failed payments</p>
            <p className="text-gray-500">All payments are up to date</p>
          </div>)}
      </div>
    </div>);
}
