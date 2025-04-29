import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

export default function ReferralCashAppForm({ 
  cashAppName, 
  onSubmit, 
  loading = false 
}) {
  const [value, setValue] = useState(cashAppName || '');
  const [error, setError] = useState('');

  // Validate the Cash App username format
  const validateCashAppName = (name) => {
    if (!name) {
      setError('Cash App username is required to receive referral payments');
      return false;
    }
    
    // Cash App username should start with $
    if (!name.startsWith('$')) {
      setError('Cash App username should start with $');
      return false;
    }
    
    // Cash App username should be at least 2 characters ($ + at least one character)
    if (name.length < 2) {
      setError('Cash App username is too short');
      return false;
    }
    
    // Clear any previous errors
    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateCashAppName(value)) {
      onSubmit(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Payment Information
        </CardTitle>
        <CardDescription>
          How you'll receive your referral payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cashAppUsername">
              Cash App Username <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="cashAppUsername"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="$YourCashAppName"
              disabled={loading}
            />
            {error ? (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Enter your Cash App username to receive payments. For example: $JohnDoe
              </p>
            )}
          </div>

          {cashAppName ? (
            <div className="text-sm text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Your Cash App information is saved
            </div>
          ) : (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Please add your Cash App username to receive referral payments
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !value || value === cashAppName}
          >
            {loading ? 'Saving...' : cashAppName ? 'Update Cash App Info' : 'Save Cash App Info'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
