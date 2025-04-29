import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

/**
 * @typedef {Object} Plan
 * @property {number} price - The price of the subscription plan
 */

/**
 * @typedef {Object} Subscription
 * @property {Plan} plan - The subscription plan details
 */

/**
 * @typedef {Object} Referrer
 * @property {string} name - The name of the referrer
 * @property {string|null} cashAppTag - The Cash App tag of the referrer
 */

/**
 * @typedef {Object} Referred
 * @property {Subscription} subscription - The subscription details
 */

/**
 * @typedef {Object} Referral
 * @property {Referrer} referrer - The referrer details
 * @property {Referred} referred - The referred person details
 */

/**
 * @typedef {Object} PaymentModalProps
 * @property {boolean} isOpen - Whether the modal is open
 * @property {Function} onClose - Function to close the modal
 * @property {Function} onSubmit - Function to handle payment submission
 * @property {Referral} referral - The referral data
 */

/**
 * PaymentModal component for processing referral payments
 * @param {PaymentModalProps} props - Component props
 * @returns {JSX.Element|null} The rendered component or null if not open
 */
export default function PaymentModal({ isOpen, onClose, onSubmit, referral }) {
    const [amount, setAmount] = useState(referral.referred.subscription.plan.price * 0.1); // 10% commission
    const [cashAppPaymentId, setCashAppPaymentId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setProcessing(true);
        try {
            await onSubmit(amount, cashAppPaymentId);
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process payment');
        }
        finally {
            setProcessing(false);
        }
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6"/>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Process Referral Payment
              </h3>

              <div className="mt-4">
                <div className="rounded-md bg-blue-50 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Paying {referral.referrer.name}
                        {referral.referrer.cashAppTag && (<span className="block">Cash App: ${referral.referrer.cashAppTag}</span>)}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (<div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>)}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Payment Amount
                    </label>
                    <div className="mt-1">
                      <input type="number" step="0.01" id="amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required/>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Suggested amount: {formatCurrency(referral.referred.subscription.plan.price * 0.1)}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="cashAppPaymentId" className="block text-sm font-medium text-gray-700">
                      Cash App Payment ID
                    </label>
                    <div className="mt-1">
                      <input type="text" id="cashAppPaymentId" value={cashAppPaymentId} onChange={(e) => setCashAppPaymentId(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required/>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="submit" disabled={processing} className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400">
                      {processing ? 'Processing...' : 'Process Payment'}
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
