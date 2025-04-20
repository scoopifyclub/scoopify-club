import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';

interface PaymentInfoReminderProps {
  userType: 'employee' | 'customer';
  hasPaymentInfo?: boolean;
  hasPaymentMethod?: boolean;
  preferredMethodSelected?: boolean;
}

export default function PaymentInfoReminder({ 
  userType, 
  hasPaymentInfo = false,
  hasPaymentMethod = false,
  preferredMethodSelected = false
}: PaymentInfoReminderProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  // Check if notification was previously dismissed
  useEffect(() => {
    const savedDismissal = localStorage.getItem(`dismissed_payment_reminder_${userType}`);
    if (savedDismissal) {
      setDismissed(true);
    }
  }, [userType]);

  // Don't show if payment info exists, preferred method is selected, or notification was dismissed
  if ((hasPaymentInfo && (userType === 'customer' || preferredMethodSelected)) || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(`dismissed_payment_reminder_${userType}`, 'true');
    setDismissed(true);
  };

  const handleAction = () => {
    if (userType === 'employee') {
      router.push('/employee/dashboard/profile');
    } else {
      router.push('/customer/dashboard/referrals');
    }
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {hasPaymentMethod && !preferredMethodSelected && userType === 'employee'
              ? 'Payment Method Selection Required'
              : 'Payment Information Missing'}
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              {userType === 'employee' 
                ? (hasPaymentMethod && !preferredMethodSelected)
                  ? 'Please select your preferred payment method (Cash App or Stripe) to ensure you receive payments correctly.'
                  : 'Please add your Cash App username or connect with Stripe to receive payments for your services.' 
                : 'Please set up your Cash App information to receive referral payments.'}
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <button
                type="button"
                onClick={handleAction}
                className="rounded-md bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
              >
                {userType === 'employee' 
                  ? 'Update Profile' 
                  : 'Set Up Payment Info'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="ml-3 rounded-md bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 