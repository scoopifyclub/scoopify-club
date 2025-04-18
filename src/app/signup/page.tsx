'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  gateCode: string;
  serviceType: string;
  serviceDay: string;
  startDate: string;
  isOneTimeService: boolean;
}

const SERVICE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function SignupForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [isOneTime, setIsOneTime] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    gateCode: '',
    serviceType: '',
    serviceDay: '',
    startDate: '',
    isOneTimeService: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      toast.error('Payment system not ready');
      setLoading(false);
      return;
    }

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (paymentError) {
        toast.error(paymentError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isOneTimeService: isOneTime,
          paymentMethodId: paymentMethod.id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create account');
      }

      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate earliest available start date (2 days from now)
  const minStartDate = new Date();
  minStartDate.setDate(minStartDate.getDate() + 2);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              required
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              required
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Service Address</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              required
              value={formData.street}
              onChange={(e) => handleChange('street', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              required
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              required
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gateCode">Gate Code (Optional)</Label>
            <Input
              id="gateCode"
              value={formData.gateCode}
              onChange={(e) => handleChange('gateCode', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Service Plan */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Service Plan</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Service Type</Label>
            <RadioGroup 
              defaultValue="subscription" 
              onValueChange={(value) => setIsOneTime(value === 'one-time')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="subscription" id="subscription" />
                <Label htmlFor="subscription" className="cursor-pointer">Subscription Service</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time" className="cursor-pointer">One-Time Service</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Select Plan</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => handleChange('serviceType', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {isOneTime ? (
                  <>
                    <SelectItem value="one-time-basic">Basic One-Time Service - $50</SelectItem>
                    <SelectItem value="one-time-premium">Premium One-Time Service - $75</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="weekly">Weekly Service - $50/week</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly Service - $75/bi-week</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {!isOneTime && (
            <div className="space-y-2">
              <Label htmlFor="serviceDay">Preferred Service Day</Label>
              <Select
                value={formData.serviceDay}
                onValueChange={(value) => handleChange('serviceDay', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_DAYS.map((day) => (
                    <SelectItem key={day} value={day.toLowerCase()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              required
              min={minStartDate.toISOString().split('T')[0]}
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Payment Information</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Secured by</span>
            <img 
              src="https://stripe.com/img/v3/home/social.png" 
              alt="Stripe" 
              className="h-6 w-auto"
            />
          </div>
        </div>
        
        <div className="p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Enter your card details securely</p>
            <div className="h-12 border rounded-md p-3 bg-gray-50">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                      iconColor: '#666EE8',
                    },
                    invalid: {
                      color: '#9e2146',
                      iconColor: '#9e2146',
                    },
                  },
                  hidePostalCode: true,
                }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700" 
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing Payment...</span>
          </div>
        ) : (
          'Create Account & Pay Securely'
        )}
      </Button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <Elements stripe={stripePromise}>
            <SignupForm />
          </Elements>
        </div>
      </div>
    </div>
  );
} 