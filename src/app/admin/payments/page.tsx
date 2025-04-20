'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'APPROVED' | 'FAILED';
  paymentMethod?: string;
  preferredPaymentMethod?: string;
  paidAt?: string;
  serviceDate?: string;
  customerName?: string;
  type: 'EARNINGS' | 'REFERRAL';
  notes?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [processingBatch, setProcessingBatch] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          paidAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to mark payment as paid');
      
      toast.success('Payment marked as paid');
      setShowPaymentModal(false);
      fetchPayments();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('Failed to mark payment as paid');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to approve');
      return;
    }

    try {
      setProcessingBatch(true);
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: selectedPayments,
          paymentMethod
        }),
      });

      if (!response.ok) throw new Error('Failed to approve payments');
      
      const data = await response.json();
      toast.success(`Successfully approved ${data.results.length} payments`);
      setSelectedPayments([]);
      fetchPayments();
    } catch (error) {
      console.error('Error approving payments:', error);
      toast.error('Failed to approve payments');
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleBatchProcess = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to process');
      return;
    }

    try {
      setProcessingBatch(true);
      const response = await fetch('/api/admin/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: selectedPayments
        }),
      });

      if (!response.ok) throw new Error('Failed to process payments');
      
      const data = await response.json();
      toast.success(`Successfully processed ${data.results.filter(r => r.status === 'PAID').length} payments`);
      setSelectedPayments([]);
      fetchPayments();
    } catch (error) {
      console.error('Error processing payments:', error);
      toast.error('Failed to process payments');
    } finally {
      setProcessingBatch(false);
    }
  };

  // Toggle payment selection
  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId) 
        : [...prev, paymentId]
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const totalPending = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800">Pending Payments</h2>
            <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800">Total Paid</h2>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedPayments.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-blue-800">Batch Actions</h2>
                <p className="text-sm text-blue-600">{selectedPayments.length} payments selected</p>
              </div>
              <div className="flex gap-2">
                <select
                  className="border rounded px-2 py-1"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH_APP">Cash App</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                </select>
                <Button
                  onClick={handleBatchApprove}
                  disabled={processingBatch}
                  variant="outline"
                  className="bg-blue-100"
                >
                  Approve Selected
                </Button>
                <Button
                  onClick={handleBatchProcess}
                  disabled={processingBatch}
                  variant="default"
                >
                  Process Payments
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(payments.filter(p => p.status === 'PENDING').map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    checked={selectedPayments.length > 0 && 
                             selectedPayments.length === payments.filter(p => p.status === 'PENDING').length}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee/Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-2 py-4">
                    {payment.status === 'PENDING' && (
                      <input 
                        type="checkbox" 
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => togglePaymentSelection(payment.id)}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.customerName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.type === 'EARNINGS' ? 'bg-blue-100 text-blue-800' : 
                      payment.type === 'REFERRAL' ? 'bg-purple-100 text-purple-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.preferredPaymentMethod ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.preferredPaymentMethod === 'CASH_APP' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                      }`}>
                        {payment.preferredPaymentMethod === 'CASH_APP' ? 'Cash App' : 'Stripe'}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.serviceDate ? new Date(payment.serviceDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.status === 'PENDING' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    ) : payment.status === 'APPROVED' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Approved
                      </span>
                    ) : payment.status === 'PAID' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {payment.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentModal(true);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Mark Payment as Paid</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Employee: {selectedPayment.employeeName}</p>
                  <p className="text-gray-600">Amount: ${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CASH_APP">Cash App</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleMarkAsPaid}>
                    Confirm Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 