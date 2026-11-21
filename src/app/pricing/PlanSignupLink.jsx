import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Checkout needs an account, a covered ZIP and a start date, so every plan
// starts at signup; /signup/payment is the only place that opens Checkout.
export default function PlanSignupLink({ planId, disabled, className, children }) {
    if (disabled) {
        return (<Button className={className} disabled>
        {children}
      </Button>);
    }
    return (<Button asChild className={className}>
      <Link href={`/signup?plan=${encodeURIComponent(planId)}`}>{children}</Link>
    </Button>);
}
