'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertCircle, DollarSign, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
    var _a;
    const params = useParams();
    const serviceId = params.id;
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();
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
        var _a;
        // Redirect to login if not authenticated
        if (status === 'unauthenticated') {
            router.push(`/login?callbackUrl=/admin/dashboard/services/${serviceId}/adjust`);
            return;
        }
        // Check if user is admin
        if (status === 'authenticated' && ((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN') {
            router.push('/');
            toast({
                title: "Access Denied",
                description: "You don't have permission to access this page."
            });
            return;
        }
        if (status === 'authenticated') {
            fetchServiceDetails();
        }
    }, [status, session, router, serviceId, toast]);
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
            // In a real app, fetch from API
            // Mock data for demonstration
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
        catch (error) {
            console.error('Error fetching service:', error);
            toast({
                title: "Error",
                description: "Failed to load service details. Please try again.",
                variant: "destructive"
            });
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
            toast({
                title: "Validation Error",
                description: "Please correct all errors before submitting.",
                variant: "destructive"
            });
            return;
        }
        setIsSubmitting(true);
        try {
            // In a real app, you would send this to your API
            // For demo, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Format data for submission
            const priceChange = price - originalPrice;
            const formattedPriceChange = priceChange >= 0
                ? `+$${priceChange.toFixed(2)}`
                : `-$${Math.abs(priceChange).toFixed(2)}`;
            // Show success message
            toast({
                title: "Service Adjusted",
                description: `Service details updated successfully. Price adjustment: ${formattedPriceChange}`,
            });
            // Redirect back to service details
            router.push(`/admin/dashboard/services/${serviceId}`);
        }
        catch (error) {
            console.error('Error adjusting service:', error);
            toast({
                title: "Error",
                description: "Failed to adjust service. Please try again.",
                variant: "destructive"
            });
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
          Changes to price, duration, or additional services may require customer approval.
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>
                Current information about the service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Service ID</p>
                  <p className="text-sm">{service.id}</p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Service Type</p>
                  <p className="text-sm">{service.serviceType.name}</p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm">{service.customer.name}</p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={cn(service.status === 'scheduled' && "bg-blue-500", service.status === 'in-progress' && "bg-orange-500", service.status === 'completed' && "bg-green-500", service.status === 'cancelled' && "bg-gray-500")}>
                    {service.status.replace('-', ' ')}
                  </Badge>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">
                    {format(parseISO(service.scheduledDate), 'PPP')}
                  </p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm">
                    {format(parseISO(service.scheduledDate), 'p')}
                  </p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Original Price</p>
                  <p className="text-sm">${originalPrice.toFixed(2)}</p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Current Duration</p>
                  <p className="text-sm">{service.duration} minutes</p>
                </div>
                <Separator />
                
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Employee</p>
                  <p className="text-sm">
                    {((_a = service.assignedEmployee) === null || _a === void 0 ? void 0 : _a.name) || 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Adjust Price & Duration</CardTitle>
              <CardDescription>
                Update service pricing and time allocation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="price-adjustment-type">Price Adjustment</Label>
                <RadioGroup value={priceAdjustmentType} onValueChange={(value) => setPriceAdjustmentType(value)} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed"/>
                    <Label htmlFor="fixed">Fixed Amount ($)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage"/>
                    <Label htmlFor="percentage">Percentage (%)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-adjustment">
                  {priceAdjustmentType === 'fixed'
            ? 'Adjustment Amount ($)'
            : 'Percentage Change (%)'}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {priceAdjustmentType === 'fixed'
            ? <DollarSign className="h-4 w-4 text-muted-foreground"/>
            : <span className="text-muted-foreground">%</span>}
                  </div>
                  <Input id="price-adjustment" type="number" step={priceAdjustmentType === 'fixed' ? '0.01' : '0.1'} placeholder={priceAdjustmentType === 'fixed' ? "0.00" : "0.0"} className="pl-8" value={priceAdjustment || ''} onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}/>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="final-price">Final Price ($)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="h-4 w-4 text-muted-foreground"/>
                  </div>
                  <Input id="final-price" type="number" step="0.01" className={cn("pl-8", errors.price && "border-red-500")} value={price || ''} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}/>
                </div>
                {errors.price && (<p className="text-sm text-red-500">Price must be greater than 0</p>)}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" className={cn(errors.duration && "border-red-500")}>
                    <SelectValue placeholder="Select duration"/>
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
                {errors.duration && (<p className="text-sm text-red-500">Duration is required</p>)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Services</CardTitle>
            <CardDescription>
              Add or remove extra services to this appointment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ADDITIONAL_SERVICES.map((service) => (<div key={service.id} className={cn("border rounded-lg p-4 cursor-pointer transition-colors", additionalServices.includes(service.id)
                ? "border-primary bg-primary/5"
                : "hover:border-muted-foreground")} onClick={() => handleAdditionalServiceToggle(service.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={additionalServices.includes(service.id)} onCheckedChange={() => { }} className="pointer-events-none"/>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          +${service.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Sparkles className="h-4 w-4 text-primary"/>
                  </div>
                </div>))}
            </div>
            
            {additionalServices.length > 0 && (<div className="flex justify-end text-sm">
                <p className="font-medium">Additional Services Total: +${additionalServicesTotal.toFixed(2)}</p>
              </div>)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
            <CardDescription>
              Add or update special instructions for this service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Enter any special instructions or notes for this service..." className="min-h-[120px]" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}/>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Reason for Adjustment (Internal Only)</Label>
              <Textarea id="adjustment-reason" placeholder="Explain why these adjustments are being made..." value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)}/>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox id="notify-customer" checked={notifyCustomer} onCheckedChange={(checked) => setNotifyCustomer(checked)}/>
              <Label htmlFor="notify-customer">
                Notify customer about these changes
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/admin/dashboard/services/${serviceId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (<>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>) : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>);
}
