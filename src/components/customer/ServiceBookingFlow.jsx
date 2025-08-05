// Enhanced Service Booking Flow Component
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
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

const ServiceBookingFlow = ({ 
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
    serviceType: initialData.serviceType || '',
    frequency: initialData.frequency || 'weekly',
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
    ...initialData
  });

  const steps = [
    { id: 1, title: 'Service Details', icon: CheckCircle },
    { id: 2, title: 'Schedule', icon: Calendar },
    { id: 3, title: 'Customization', icon: Clock },
    { id: 4, title: 'Review & Book', icon: CreditCard },
  ];

  const serviceTypes = [
    { id: 'basic', name: 'Basic Cleanup', price: 25, description: 'Standard yard cleanup' },
    { id: 'premium', name: 'Premium Service', price: 35, description: 'Thorough cleanup with sanitizer' },
    { id: 'deluxe', name: 'Deluxe Package', price: 45, description: 'Complete cleanup with deodorizer' },
  ];

  const frequencies = [
    { id: 'weekly', name: 'Weekly', discount: 0 },
    { id: 'biweekly', name: 'Bi-weekly', discount: 10 },
    { id: 'monthly', name: 'Monthly', discount: 15 },
  ];

  const addOns = [
    { id: 'sanitizer', name: 'Sanitizer Treatment', price: 5, description: 'Eliminates odors and bacteria' },
    { id: 'deodorizer', name: 'Deodorizer', price: 8, description: 'Long-lasting fresh scent' },
    { id: 'extraPets', name: 'Extra Pets', price: 3, description: 'Additional pet fee' },
    { id: 'largeYard', name: 'Large Yard', price: 10, description: 'For yards over 1/2 acre' },
  ];

  const calculateTotal = () => {
    const baseService = serviceTypes.find(s => s.id === formData.serviceType);
    const frequency = frequencies.find(f => f.id === formData.frequency);
    const selectedAddOns = addOns.filter(addon => formData.addOns.includes(addon.id));
    
    let total = baseService?.price || 0;
    total += selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    
    if (frequency?.discount) {
      total = total * (1 - frequency.discount / 100);
    }
    
    return total;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const bookingData = {
        ...formData,
        total: calculateTotal(),
        bookingDate: new Date().toISOString(),
        status: 'pending'
      };
      
      onComplete?.(bookingData);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Your Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serviceTypes.map((service) => (
            <Card
              key={service.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                formData.serviceType === service.id && "ring-2 ring-primary-500 bg-primary-50"
              )}
              onClick={() => updateFormData('serviceType', service.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-600">
                  ${service.price}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Service Frequency</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {frequencies.map((freq) => (
            <Card
              key={freq.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                formData.frequency === freq.id && "ring-2 ring-primary-500 bg-primary-50"
              )}
              onClick={() => updateFormData('frequency', freq.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{freq.name}</CardTitle>
                {freq.discount > 0 && (
                  <Badge variant="secondary" className="w-fit">
                    {freq.discount}% off
                  </Badge>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
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
            placeholder="Enter gate code"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Your Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => updateFormData('startDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <Label htmlFor="preferredDay">Preferred Day</Label>
            <Select value={formData.preferredDay} onValueChange={(value) => updateFormData('preferredDay', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="preferredTime">Preferred Time</Label>
            <Select value={formData.preferredTime} onValueChange={(value) => updateFormData('preferredTime', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="petCount">Number of Pets</Label>
            <Select value={formData.petCount.toString()} onValueChange={(value) => updateFormData('petCount', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of pets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Pet</SelectItem>
                <SelectItem value="2">2 Pets</SelectItem>
                <SelectItem value="3">3 Pets</SelectItem>
                <SelectItem value="4">4+ Pets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Customize Your Service</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="yardSize">Yard Size</Label>
            <Select value={formData.yardSize} onValueChange={(value) => updateFormData('yardSize', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select yard size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (under 1/4 acre)</SelectItem>
                <SelectItem value="medium">Medium (1/4 - 1/2 acre)</SelectItem>
                <SelectItem value="large">Large (over 1/2 acre)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Add-On Services</Label>
            <div className="space-y-3 mt-2">
              {addOns.map((addon) => (
                <div key={addon.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={addon.id}
                    checked={formData.addOns.includes(addon.id)}
                    onCheckedChange={(checked) => {
                      const newAddOns = checked
                        ? [...formData.addOns, addon.id]
                        : formData.addOns.filter(id => id !== addon.id);
                      updateFormData('addOns', newAddOns);
                    }}
                  />
                  <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{addon.name}</span>
                      <span className="text-primary-600 font-medium">+${addon.price}</span>
                    </div>
                    <p className="text-sm text-neutral-600">{addon.description}</p>
                  </Label>
                </div>
              ))}
            </div>
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
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Your Booking</h3>
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">Service Details</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {serviceTypes.find(s => s.id === formData.serviceType)?.name}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {frequencies.find(f => f.id === formData.frequency)?.name} service
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">Schedule</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Starting {formData.startDate}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {formData.preferredDay} at {formData.preferredTime}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">Location</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {formData.address}
              </p>
              {formData.gateCode && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Gate Code: {formData.gateCode}
                </p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">Customization</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {formData.petCount} pet(s), {formData.yardSize} yard
              </p>
              {formData.addOns.length > 0 && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formData.addOns.length} add-on(s) selected
                </p>
              )}
            </div>
          </div>
          
          {formData.specialInstructions && (
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">Special Instructions</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {formData.specialInstructions}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">Total Cost</span>
          <span className="text-2xl font-bold text-primary-600">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Billed according to your selected frequency
        </p>
      </div>
    </div>
  );

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
      case 1: return formData.serviceType && formData.address;
      case 2: return formData.startDate && formData.preferredDay && formData.preferredTime;
      case 3: return true; // Customization is optional
      case 4: return true; // Review step
      default: return false;
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)} {...props}>
      <LoadingOverlay isLoading={loading} message="Creating your booking...">
        <div className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep >= step.id
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "border-neutral-300 text-neutral-400"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  currentStep >= step.id
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-400"
                )}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4",
                    currentStep > step.id ? "bg-primary-500" : "bg-neutral-300"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {currentStep === 1 && "Choose your service type and frequency"}
                {currentStep === 2 && "Select your preferred schedule"}
                {currentStep === 3 && "Customize your service with add-ons"}
                {currentStep === 4 && "Review and confirm your booking"}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            
            <div className="flex space-x-3">
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
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default ServiceBookingFlow; 