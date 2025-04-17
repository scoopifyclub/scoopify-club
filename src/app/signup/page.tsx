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

export default function SignupPage() {
  const router = useRouter();
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

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isOneTimeService: isOneTime
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Service Address</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    required
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    required
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="gateCode">Gate Code (Optional)</Label>
                  <Input
                    id="gateCode"
                    value={formData.gateCode}
                    onChange={(e) => handleChange('gateCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Service Plan */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Service Plan</h3>
              
              <div className="space-y-4">
                <Label>Service Type</Label>
                <RadioGroup 
                  defaultValue="subscription" 
                  onValueChange={(value) => setIsOneTime(value === 'one-time')}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subscription" id="subscription" />
                    <Label htmlFor="subscription">Weekly Service</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one-time" id="one-time" />
                    <Label htmlFor="one-time">One-Time Cleanup</Label>
                  </div>
                </RadioGroup>

                <div>
                  <Label htmlFor="serviceType">Number of Dogs</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => handleChange('serviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of dogs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-dog">
                        1 Dog - {isOneTime ? '$75' : '$55/week'}
                      </SelectItem>
                      <SelectItem value="2-dog">
                        2 Dogs - {isOneTime ? '$90' : '$70/week'}
                      </SelectItem>
                      <SelectItem value="3-plus">
                        3+ Dogs - {isOneTime ? '$120' : '$100/week'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isOneTime && (
                  <div>
                    <Label htmlFor="serviceDay">Preferred Service Day</Label>
                    <Select
                      value={formData.serviceDay}
                      onValueChange={(value) => handleChange('serviceDay', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred day" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_DAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    min={minStartDate.toISOString().split('T')[0]}
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 