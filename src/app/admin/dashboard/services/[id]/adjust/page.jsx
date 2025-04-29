'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle, DollarSign, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
// Duration options in minutes
const DURATION_OPTIONS = [
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
    { value: '150', label: '2.5 hours' },
    { value: '180', label: '3 hours' },
    { value: '240', label: '4 hours' },
    { value: '300', label: '5 hours' }
];
// Additional services that can be added
const ADDITIONAL_SERVICES = [
    { id: 'windows', name: 'Window Cleaning', price: 25 },
    { id: 'fridge', name: 'Inside Fridge', price: 15 },
    { id: 'oven', name: 'Inside Oven', price: 20 },
    { id: 'cabinets', name: 'Inside Cabinets', price: 25 },
    { id: 'baseboards', name: 'Baseboards', price: 15 },
    { id: 'walls', name: 'Walls Spot Cleaning', price: 20 },
    { id: 'laundry', name: 'Laundry', price: 15 }
];
export default function AdjustServicePage() {
    const params = useParams();
    const serviceId = params.id;
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [service, setService] = useState(null);
    // Form state
    const [price, setPrice] = useState(0);
    const [duration, setDuration] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [additionalServices, setAdditionalServices] = useState([]);
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [priceAdjustmentType, setPriceAdjustmentType] = useState('fixed');
    const [priceAdjustment, setPriceAdjustment] = useState(0);
    const [notifyCustomer, setNotifyCustomer] = useState(true);
    // Validation state
    const [errors, setErrors] = useState({
        price: false,
        duration: false
    });
    // Derived state
    const [originalPrice, setOriginalPrice] = useState(0);
    const [additionalServicesTotal, setAdditionalServicesTotal] = useState(0);
    useEffect(() => {
        if (status === 'authenticated') {
            fetchServiceDetails();
        }
    }, [status, serviceId]);
    // Calculate additional services total whenever selection changes
    useEffect(() => {
        let total = 0;
        for (const serviceId of additionalServices) {
            const service = ADDITIONAL_SERVICES.find(s => s.id === serviceId);
            if (service) {
                total += service.price;
            }
        }
        setAdditionalServicesTotal(total);
    }, [additionalServices]);
    // Calculate price based on adjustments
    useEffect(() => {
        if (priceAdjustmentType === 'fixed') {
            setPrice(originalPrice + priceAdjustment + additionalServicesTotal);
        }
        else {
            // Percentage adjustment
            const adjustmentAmount = originalPrice * (priceAdjustment / 100);
            setPrice(originalPrice + adjustmentAmount + additionalServicesTotal);
        }
    }, [originalPrice, priceAdjustment, priceAdjustmentType, additionalServicesTotal]);
    const fetchServiceDetails = async () => {
        try {
            const response = await fetch(`/api/admin/services/${serviceId}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch service details');
            }
            const data = await response.json();
            setService(data);
            setOriginalPrice(data.price);
            setPrice(data.price);
            setDuration(data.duration.toString());
            setSpecialInstructions(data.specialInstructions || '');
            setAdditionalServices(data.additionalServices || []);
            // Calculate initial additional services total
            let total = 0;
            for (const serviceId of data.additionalServices || []) {
                const service = ADDITIONAL_SERVICES.find(s => s.id === serviceId);
                if (service) {
                    total += service.price;
                }
            }
            setAdditionalServicesTotal(total);
        }
        catch (error) {
            console.error('Error fetching service:', error);
            toast.error('Failed to load service details');
            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                const mockService = {
                    id: serviceId,
                    status: 'scheduled',
                    scheduledDate: '2023-11-15T10:00:00Z',
                    duration: 120,
                    price: 85.00,
                    notes: 'Regular bi-weekly cleaning service.',
                    customer: {
                        id: '101',
                        name: 'John Smith',
                        address: '123 Main St, Anytown, USA'
                    },
                    serviceType: {
                        id: '301',
                        name: 'Regular Cleaning'
                    },
                    assignedEmployee: {
                        id: 'emp-123',
                        name: 'Sarah Johnson'
                    },
                    specialInstructions: 'Customer has a cat, please be careful when opening doors.',
                    additionalServices: ['windows']
                };
                setService(mockService);
                setOriginalPrice(mockService.price);
                setPrice(mockService.price);
                setDuration(mockService.duration.toString());
                setSpecialInstructions(mockService.specialInstructions || '');
                setAdditionalServices(mockService.additionalServices || []);
                // Calculate initial additional services total
                let total = 0;
                for (const serviceId of mockService.additionalServices) {
                    const service = ADDITIONAL_SERVICES.find(s => s.id === serviceId);
                    if (service) {
                        total += service.price;
                    }
                }
                setAdditionalServicesTotal(total);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    const validateForm = () => {
        const newErrors = {
            price: price <= 0,
            duration: !duration
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };
    const handleAdditionalServiceToggle = (serviceId) => {
        setAdditionalServices(prev => {
            if (prev.includes(serviceId)) {
                return prev.filter(id => id !== serviceId);
            }
            else {
                return [...prev, serviceId];
            }
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Please correct all errors before submitting');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/services/${serviceId}/adjust`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    price,
                    duration: parseInt(duration),
                    specialInstructions,
                    additionalServices,
                    adjustmentReason,
                    priceAdjustment: {
                        type: priceAdjustmentType,
                        amount: priceAdjustment
                    },
                    notifyCustomer
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to adjust service');
            }
            const data = await response.json();
            // Format price change for message
            const priceChange = price - originalPrice;
            const formattedPriceChange = priceChange >= 0
                ? `+$${priceChange.toFixed(2)}`
                : `-$${Math.abs(priceChange).toFixed(2)}`;
            toast.success(`Service adjusted successfully. Price adjustment: ${formattedPriceChange}`);
            router.push(`/admin/dashboard/services/${serviceId}`);
        }
        catch (error) {
            console.error('Error adjusting service:', error);
            toast.error('Failed to adjust service');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (status === 'loading' || isLoading) {
        return (<div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    if (!service) {
        return (<div className="flex flex-col items-center justify-center h-[400px]">
        <h2 className="text-xl font-semibold mb-2">Service not found</h2>
        <p className="text-muted-foreground mb-4">The requested service could not be found.</p>
        <Button onClick={() => router.push('/admin/dashboard/services')}>
          <ArrowLeft className="h-4 w-4 mr-2"/>
          Back to Services
        </Button>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/dashboard/services/${serviceId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1"/>
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Adjust Service</h1>
        </div>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>You are adjusting service details</AlertTitle>
        <AlertDescription>
          Changes made here will affect pricing, scheduling, and customer notifications.
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
            <CardDescription>
              Service #{service.id} - {service.serviceType.name} for {service.customer.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Adjustment */}
            <div className="space-y-4">
              <Label>Price Adjustment</Label>
              <RadioGroup value={priceAdjustmentType} onValueChange={setPriceAdjustmentType} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed"/>
                  <Label htmlFor="fixed">Fixed Amount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage"/>
                  <Label htmlFor="percentage">Percentage</Label>
                </div>
              </RadioGroup>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  {priceAdjustmentType === 'fixed' && (
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                  )}
                  <Input
                    type="number"
                    value={priceAdjustment}
                    onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                    className={cn(
                      "w-[100px]",
                      priceAdjustmentType === 'fixed' && "pl-9"
                    )}
                    step={priceAdjustmentType === 'percentage' ? '1' : '0.01'}
                  />
                </div>
                {priceAdjustmentType === 'percentage' && <span>%</span>}
                <span className="text-sm text-muted-foreground">
                  New Total: ${price.toFixed(2)}
                </span>
              </div>
            </div>
            <Separator />
            {/* Duration */}
            <div className="space-y-4">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select duration"/>
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.duration && (
                <p className="text-sm text-destructive">Duration is required</p>
              )}
            </div>
            <Separator />
            {/* Additional Services */}
            <div className="space-y-4">
              <Label>Additional Services</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ADDITIONAL_SERVICES.map(service => (
                  <div 
                    key={service.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={service.id}
                      checked={additionalServices.includes(service.id)}
                      onCheckedChange={() => handleAdditionalServiceToggle(service.id)}
                    />
                    <Label htmlFor={service.id} className="flex-1">
                      {service.name}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      ${service.price}
                    </span>
                  </div>
                ))}
              </div>
              {additionalServicesTotal > 0 && (
                <p className="text-sm text-muted-foreground">
                  Additional services total: ${additionalServicesTotal.toFixed(2)}
                </p>
              )}
            </div>
            <Separator />
            {/* Special Instructions */}
            <div className="space-y-4">
              <Label>Special Instructions</Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Add any special instructions..."
                className="h-32"
              />
            </div>
            <Separator />
            {/* Adjustment Reason */}
            <div className="space-y-4">
              <Label>Adjustment Reason</Label>
              <Textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Explain why these adjustments are being made..."
                className="h-32"
                required
              />
            </div>
            {/* Notify Customer */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyCustomer"
                checked={notifyCustomer}
                onCheckedChange={setNotifyCustomer}
              />
              <Label htmlFor="notifyCustomer">
                Notify customer about these changes
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/dashboard/services/${serviceId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>);
}
