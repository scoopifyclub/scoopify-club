'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function PayoutRequest({ employeeId }) {
  const [pendingServices, setPendingServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState({ stripe: 0, cashApp: 0 });
  const [netAmount, setNetAmount] = useState(0);

  useEffect(() => {
    fetchPendingServices();
  }, [employeeId]);

  useEffect(() => {
    calculateFees();
  }, [selectedServices, paymentMethod]);

  const fetchPendingServices = async () => {
    try {
      const response = await fetch('/api/employee/earnings?status=pending');
      if (response.ok) {
        const data = await response.json();
        setPendingServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching pending services:', error);
    }
  };

  const calculateFees = () => {
    const totalAmount = selectedServices.reduce((sum, serviceId) => {
      const service = pendingServices.find(s => s.id === serviceId);
      return sum + (service?.potentialEarnings || 0);
    }, 0);

    // Stripe fees: 0.25% + $0.25 per payout
    const stripeFees = 0.25 + (totalAmount * 0.0025);
    
    // Cash App fees: $0.25 per transaction + 1.5% of amount
    const cashAppFees = 0.25 + (totalAmount * 0.015);

    setFees({ stripe: stripeFees, cashApp: cashAppFees });
    setNetAmount(totalAmount - (paymentMethod === 'STRIPE' ? stripeFees : cashAppFees));
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedServices.length === pendingServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(pendingServices.map(s => s.id));
    }
  };

  const handlePayoutRequest = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service for payout');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employee/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          serviceIds: selectedServices,
          amount: netAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedServices([]);
        fetchPendingServices(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to process payout request');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to process payout request');
    } finally {
      setLoading(false);
    }
  };

  const totalSelectedAmount = selectedServices.reduce((sum, serviceId) => {
    const service = pendingServices.find(s => s.id === serviceId);
    return sum + (service?.potentialEarnings || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Payout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe Option */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'STRIPE' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('STRIPE')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Weekly Direct Deposit</span>
                </div>
                {paymentMethod === 'STRIPE' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Processed every Friday</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span>Low fees: ${fees.stripe.toFixed(2)}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </div>
            </div>

            {/* Cash App Option */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'CASH_APP' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('CASH_APP')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Same-Day Cash App</span>
                </div>
                {paymentMethod === 'CASH_APP' && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>Instant payout</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <span>Higher fees: ${fees.cashApp.toFixed(2)}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Same Day
                </Badge>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Fee Breakdown:</strong> {paymentMethod === 'STRIPE' 
                ? 'Stripe charges 0.25% + $0.25 per payout for direct deposits.' 
                : 'Cash App charges $0.25 + 1.5% for instant transfers.'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Services for Payout</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending services found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={selectedServices.length === pendingServices.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="font-medium">
                  Select All ({pendingServices.length} services)
                </label>
              </div>

              {/* Service List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={service.id} className="cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {service.customer?.user?.name || 'Customer'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(service.completedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              ${service.potentialEarnings?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Earnings:</span>
                <span className="font-semibold">${totalSelectedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Fees ({paymentMethod === 'STRIPE' ? 'Stripe' : 'Cash App'}):</span>
                <span>-${(paymentMethod === 'STRIPE' ? fees.stripe : fees.cashApp).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Payout:</span>
                  <span className="text-green-600">${netAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                onClick={handlePayoutRequest}
                disabled={loading || selectedServices.length === 0}
                className="w-full"
              >
                {loading ? (
                  'Processing...'
                ) : (
                  `Request ${paymentMethod === 'CASH_APP' ? 'Same-Day' : 'Weekly'} Payout`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 