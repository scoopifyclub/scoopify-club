import { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentDate: string;
  cashAppPaymentId: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: {
    id: string;
    referrer: {
      name: string;
      email: string;
      cashAppTag: string | null;
    };
    referred: {
      name: string;
      subscription: {
        plan: {
          name: string;
          price: number;
        };
      };
    };
    payments: Payment[];
  };
}

export default function PaymentHistoryModal({ isOpen, onClose, referral }: PaymentHistoryModalProps) {
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateReceipt = async (payment: Payment) => {
    setGeneratingReceipt(payment.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/referrals/payment/${payment.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to generate receipt');

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.id}.pdf`;
      
      // Append link to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate receipt');
    } finally {
      setGeneratingReceipt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Payment History
              </h3>

              <div className="mt-4">
                <div className="rounded-md bg-blue-50 p-4 mb-4">
                  <div className="flex flex-col">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Referrer:</span> {referral.referrer.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Referred:</span> {referral.referred.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Plan:</span> {referral.referred.subscription.plan.name}
                    </p>
                    {referral.referrer.cashAppTag && (
                      <p className="text-sm text-blue-700">
                        <span className="font-semibold">Cash App:</span> ${referral.referrer.cashAppTag}
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="mt-4">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Date
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Amount
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Cash App ID
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Receipt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {referral.payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center">
                              No payments found
                            </td>
                          </tr>
                        ) : (
                          referral.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                                {formatDate(new Date(payment.paymentDate))}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                {payment.cashAppPaymentId}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  payment.status === 'COMPLETED' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <button
                                  onClick={() => handleGenerateReceipt(payment)}
                                  disabled={generatingReceipt === payment.id}
                                  className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                                >
                                  <ArrowDownTrayIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 