import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface SubscriptionCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  interval: 'weekly' | 'biweekly' | 'monthly';
  popular?: boolean;
  onSelect?: () => void;
}

export function SubscriptionCard({
  name,
  price,
  description,
  features,
  interval,
  popular,
  onSelect,
}: SubscriptionCardProps) {
  return (
    <div className={`relative rounded-2xl bg-white p-8 shadow-lg ${
      popular ? 'ring-2 ring-emerald-500' : 'ring-1 ring-gray-200'
    }`}>
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-sm font-medium text-white">
          Most Popular
        </span>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold tracking-tight text-gray-900">${price}</span>
          <span className="text-sm font-semibold text-gray-600">/{interval}</span>
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
            <span className="ml-3 text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        className={`w-full ${
          popular
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        Select Plan
      </Button>
    </div>
  );
} 