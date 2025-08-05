// Subscription Management Flow Component
// Aligned with monthly payment + weekly service model
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft, DollarSign, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const SubscriptionManagementFlow = ({
  onComplete,
  onCancel,
  initialData = {},
  className,
  ...props
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: initialData.serviceType || 'basic',
    address: initialData.address || '',
    gateCode: initialData.gateCode || '',
    specialInstructions: initialData.specialInstructions || '',
    preferredDay: initialData.preferredDay || '',
    preferredTime: initialData.preferredTime || '',
    startDate: initialData.startDate || '',
    petCount: initialData.petCount || 1,
    yardSize: initialData.yardSize || 'medium',
    addOns: initialData.addOns || [],
    paymentMethod: initialData.paymentMethod || 'card',
    billingCycle: 'monthly', // Fixed for subscription model
    ...initialData
  });

  const steps = [
    { id: 1, title: 'Service Details', icon: CheckCircle },
    { id: 2, title: 'Schedule Preferences', icon: Calendar },
    { id: 3, title: 'Customization', icon: Clock },
    { id: 4, title: 'Payment Setup', icon: CreditCard },
  ];

  const serviceTypes = [
    { 
      id: 'basic', 
      name: 'Basic Weekly Service', 
      monthlyPrice: 100, 
      description: 'Standard yard cleanup once per week',
      features: ['Weekly yard cleanup', 'Basic waste removal', 'Standard service']
    },
    { 
      id: 'premium', 
      name: 'Premium Weekly Service', 
      monthlyPrice: 140, 
      description: 'Thorough cleanup with sanitizer once per week',
      features: ['Weekly yard cleanup', 'Sanitizer treatment', 'Odor elimination', 'Premium service']
    },
    { 
      id: 'deluxe', 
      name: 'Deluxe Weekly Service', 
      monthlyPrice: 180, 
      description: 'Complete cleanup with deodorizer once per week',
      features: ['Weekly yard cleanup', 'Sanitizer treatment', 'Deodorizer', 'Priority scheduling', 'Deluxe service']
    },
  ];

  const availableDays = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
  ];

  const timeSlots = [
    { id: 'morning', name: 'Morning (8 AM - 12 PM)' },
    { id: 'afternoon', name: 'Afternoon (12 PM - 4 PM)' },
    { id: 'evening', name: 'Evening (4 PM - 8 PM)' },
  ];

  const addOns = [
    { id: 'sanitizer', name: 'Sanitizer Treatment', monthlyPrice: 20, description: 'Eliminates odors and bacteria weekly' },
    { id: 'deodorizer', name: 'Deodorizer', monthlyPrice: 25, description: 'Long-lasting fresh scent weekly' },
    { id: 'extraPets', name: 'Extra Pets (2+ pets)', monthlyPrice: 15, description: 'Additional pet fee' },
    { id: 'largeYard', name: 'Large Yard (1/2+ acre)', monthlyPrice: 30, description: 'For yards over 1/2 acre' },
  ];

  const calculateMonthlyTotal = () => {
    const baseService = serviceTypes.find(s => s.id === formData.serviceType);
    const basePrice = baseService ? baseService.monthlyPrice : 0;
    
    const addOnsTotal = formData.addOns.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.monthlyPrice : 0);
    }, 0);

    return basePrice + addOnsTotal;
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simulate API call to create subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const subscriptionData = {
        ...formData,
        monthlyTotal: calculateMonthlyTotal(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      };

      console.log('Creating subscription:', subscriptionData);
      
      if (onComplete) {
        onComplete(subscriptionData);
      } else {
        router.push('/customer/dashboard');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Your Weekly Service</h3>
        <p className="text-gray-600 mb-6">Select your preferred service level. You'll receive this service once per week on your chosen day.</p>
      </div>
      
      <div className="grid gap-4">
        {serviceTypes.map((service) => (
          <Card 
            key={service.id}
            className={cn(
              "cursor-pointer transition-all",
              formData.serviceType === service.id 
                ? "ring-2 ring-primary border-primary" 
                : "hover:shadow-md"
            )}
            onClick={() => updateFormData('serviceType', service.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg font-semibold">
                  ${service.monthlyPrice}/month
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Service Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            placeholder="Enter your service address"
          />
        </div>
        
        <div>
          <Label htmlFor="gateCode">Gate Code (if applicable)</Label>
          <Input
            id="gateCode"
            value={formData.gateCode}
            onChange={(e) => updateFormData('gateCode', e.target.value)}
            placeholder="Enter gate code or leave blank"
          />
        </div>

        <div>
          <Label htmlFor="specialInstructions">Special Instructions</Label>
          <Textarea
            id="specialInstructions"
            value={formData.specialInstructions}
            onChange={(e) => updateFormData('specialInstructions', e.target.value)}
            placeholder="Any special instructions for our team..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Schedule Your Weekly Service</h3>
        <p className="text-gray-600 mb-6">Choose your preferred day and time for weekly service.</p>
      </div>

      <div className="grid gap-6">
        <div>
          <Label>Preferred Day of Week</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {availableDays.map((day) => (
              <Button
                key={day.id}
                variant={formData.preferredDay === day.id ? "default" : "outline"}
                onClick={() => updateFormData('preferredDay', day.id)}
                className="justify-start"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {day.name}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label>Preferred Time Window</Label>
          <Select value={formData.preferredTime} onValueChange={(value) => updateFormData('preferredTime', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select time window" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.id} value={slot.id}>
                  {slot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">Service Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateFormData('startDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-sm text-gray-500 mt-1">
            Your first service will be scheduled for the next available {formData.preferredDay || 'day'} after this date.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Customize Your Service</h3>
        <p className="text-gray-600 mb-6">Add any additional services or specify your yard details.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label>Number of Pets</Label>
          <Select value={formData.petCount.toString()} onValueChange={(value) => updateFormData('petCount', parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, '6+'].map((count) => (
                <SelectItem key={count} value={count.toString()}>
                  {count} {count === 1 ? 'pet' : 'pets'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Yard Size</Label>
          <Select value={formData.yardSize} onValueChange={(value) => updateFormData('yardSize', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (under 1/4 acre)</SelectItem>
              <SelectItem value="medium">Medium (1/4 - 1/2 acre)</SelectItem>
              <SelectItem value="large">Large (over 1/2 acre)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Additional Services (Optional)</Label>
          <div className="space-y-3 mt-2">
            {addOns.map((addOn) => (
              <div key={addOn.id} className="flex items-center space-x-3">
                <Checkbox
                  id={addOn.id}
                  checked={formData.addOns.includes(addOn.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFormData('addOns', [...formData.addOns, addOn.id]);
                    } else {
                      updateFormData('addOns', formData.addOns.filter(id => id !== addOn.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={addOn.id} className="font-medium cursor-pointer">
                    {addOn.name} - ${addOn.monthlyPrice}/month
                  </Label>
                  <p className="text-sm text-gray-500">{addOn.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const monthlyTotal = calculateMonthlyTotal();
    const selectedService = serviceTypes.find(s => s.id === formData.serviceType);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Review & Setup Payment</h3>
          <p className="text-gray-600 mb-6">Review your subscription details and set up monthly billing.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Service:</span>
              <span>{selectedService?.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Schedule:</span>
              <span>Weekly on {formData.preferredDay ? availableDays.find(d => d.id === formData.preferredDay)?.name : 'TBD'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Time:</span>
              <span>{formData.preferredTime ? timeSlots.find(t => t.id === formData.preferredTime)?.name : 'TBD'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Address:</span>
              <span className="text-right">{formData.address}</span>
            </div>

            {formData.addOns.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Additional Services:</h4>
                {formData.addOns.map(addOnId => {
                  const addOn = addOns.find(a => a.id === addOnId);
                  return (
                    <div key={addOnId} className="flex justify-between items-center text-sm">
                      <span>{addOn?.name}</span>
                      <span>${addOn?.monthlyPrice}/month</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Monthly Total:</span>
                <span className="text-primary">${monthlyTotal}/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Billed monthly • Cancel anytime • First service scheduled for {formData.startDate || 'TBD'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <Label>Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="bank">Bank Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your subscription will be activated immediately</li>
              <li>• First payment will be processed today</li>
              <li>• Your first service will be scheduled for the next available {formData.preferredDay || 'day'}</li>
              <li>• You'll receive confirmation and scheduling details via email</li>
              <li>• Future payments will be automatically charged monthly</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.serviceType && formData.address;
      case 2:
        return formData.preferredDay && formData.preferredTime && formData.startDate;
      case 3:
        return true; // Customization is optional
      case 4:
        return formData.paymentMethod;
      default:
        return false;
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)} {...props}>
      <LoadingOverlay isLoading={loading} message="Setting up your subscription...">
        <div className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2",
                  currentStep >= step.id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background border-muted-foreground text-muted-foreground"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="pt-6">
              {renderCurrentStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Setting Up Subscription...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Start Subscription
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default SubscriptionManagementFlow; 