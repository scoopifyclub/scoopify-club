'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  DollarSign, 
  CreditCard, 
  Zap, 
  Save, 
  CheckCircle,
  Info,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeProfile({ employeeId }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    cashAppUsername: '',
    preferredPaymentMethod: 'STRIPE'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [onboardingUrl, setOnboardingUrl] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchStripeStatus();
  }, [employeeId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/employee/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch('/api/employee/stripe-connect?action=status');
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStripeOnboarding = async () => {
    try {
      const response = await fetch('/api/employee/stripe-connect?action=onboarding-link');
      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.url);
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to create onboarding link');
      }
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      toast.error('Failed to create onboarding link');
    }
  };

  const handleRefreshStripeStatus = async () => {
    try {
      const response = await fetch('/api/employee/stripe-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh-status' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
        toast.success('Stripe status refreshed');
      }
    } catch (error) {
      console.error('Error refreshing Stripe status:', error);
      toast.error('Failed to refresh status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="cashAppUsername">Cash App Username</Label>
              <Input
                id="cashAppUsername"
                value={profile.cashAppUsername}
                onChange={(e) => handleInputChange('cashAppUsername', e.target.value)}
                placeholder="Enter your Cash App username"
              />
              <p className="text-sm text-gray-500 mt-1">
                Required for same-day payouts via Cash App
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connect Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Direct Deposit Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stripeStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stripe Connect Status</p>
                  <p className="text-sm text-gray-600">{stripeStatus.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={stripeStatus.isReady ? 'default' : 'secondary'}
                    className={stripeStatus.isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {stripeStatus.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshStripeStatus}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {!stripeStatus.isReady && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Setup Required</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        To receive weekly direct deposits, you need to set up your Stripe Connect account with your bank information.
                      </p>
                      <Button
                        onClick={handleStripeOnboarding}
                        className="mt-3"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Set Up Direct Deposit
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {stripeStatus.isReady && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Ready for Direct Deposits</p>
                      <p className="text-sm text-green-700 mt-1">
                        Your account is set up and ready to receive weekly direct deposits via Stripe.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading Stripe status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe Option */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                profile.preferredPaymentMethod === 'STRIPE' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('preferredPaymentMethod', 'STRIPE')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Weekly Direct Deposit</span>
                </div>
                {profile.preferredPaymentMethod === 'STRIPE' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Automatic weekly payouts via Stripe</p>
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              </div>
            </div>

            {/* Cash App Option */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                profile.preferredPaymentMethod === 'CASH_APP' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('preferredPaymentMethod', 'CASH_APP')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Same-Day Cash App</span>
                </div>
                {profile.preferredPaymentMethod === 'CASH_APP' && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Instant payouts via Cash App (higher fees)</p>
                <Badge variant="outline" className="text-xs">
                  Same Day
                </Badge>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Weekly payouts are automatically processed via Stripe every Friday. 
              You can request same-day Cash App payouts anytime through the "Request Payout" section.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 