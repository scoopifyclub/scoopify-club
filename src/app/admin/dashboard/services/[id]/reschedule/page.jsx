'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, parseISO, setHours, setMinutes, isBefore } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Time slots for selection
const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

// Duration options in minutes
const DURATION_OPTIONS = [
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
    { value: '150', label: '2.5 hours' },
    { value: '180', label: '3 hours' },
    { value: '240', label: '4 hours' }
];

export default function RescheduleServicePage() {
    const params = useParams();
    const serviceId = params.id;
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [service, setService] = useState(null);

    // Form state
    const [date, setDate] = useState(undefined);
    const [timeSlot, setTimeSlot] = useState('');
    const [duration, setDuration] = useState('');
    const [reason, setReason] = useState('');

    // Validation state
    const [errors, setErrors] = useState({
        date: false,
        timeSlot: false,
        duration: false
    });

    useEffect(() => {
        if (status === 'authenticated') {
            fetchServiceDetails();
        }
    }, [status, serviceId]);

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

            // Initialize form with current values
            const scheduledDate = parseISO(data.scheduledDate);
            setDate(scheduledDate);

            // Format time as HH:MM
            const hours = scheduledDate.getHours().toString().padStart(2, '0');
            const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            // Find the closest time slot
            const closestTimeSlot = TIME_SLOTS.find(slot => slot === formattedTime) || TIME_SLOTS[0];
            setTimeSlot(closestTimeSlot);

            // Set duration
            setDuration(data.duration.toString());
        } catch (error) {
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
                    notes: 'Customer requested extra attention to kitchen and bathrooms.',
                    customer: {
                        id: '101',
                        name: 'John Smith'
                    },
                    serviceType: {
                        id: '301',
                        name: 'Regular Cleaning'
                    }
                };
                setService(mockService);

                // Initialize form with mock values
                const scheduledDate = parseISO(mockService.scheduledDate);
                setDate(scheduledDate);

                const hours = scheduledDate.getHours().toString().padStart(2, '0');
                const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');
                const formattedTime = `${hours}:${minutes}`;
                const closestTimeSlot = TIME_SLOTS.find(slot => slot === formattedTime) || TIME_SLOTS[0];
                setTimeSlot(closestTimeSlot);
                setDuration(mockService.duration.toString());
            }
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {
            date: !date,
            timeSlot: !timeSlot,
            duration: !duration
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!date || !timeSlot || !service) return;

        setIsSubmitting(true);

        try {
            // Create a new date with the selected date and time
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const newDate = new Date(date);
            const scheduledDateTime = setMinutes(setHours(newDate, hours), minutes);

            // Check if the new date is in the past
            if (isBefore(scheduledDateTime, new Date())) {
                toast.error('The scheduled date and time cannot be in the past');
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`/api/admin/services/${serviceId}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    scheduledDate: scheduledDateTime.toISOString(),
                    duration: parseInt(duration),
                    reason
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reschedule service');
            }

            const data = await response.json();
            
            toast.success(`Service rescheduled to ${format(scheduledDateTime, 'PPP')} at ${format(scheduledDateTime, 'p')}`);
            router.push(`/admin/dashboard/services/${serviceId}`);
        } catch (error) {
            console.error('Error rescheduling service:', error);
            toast.error('Failed to reschedule service');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTimeDisplay = (timeSlot) => {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return format(date, 'h:mm a');
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <h2 className="text-xl font-semibold mb-2">Service not found</h2>
                <p className="text-muted-foreground mb-4">The requested service could not be found.</p>
                <Button onClick={() => router.push('/admin/dashboard/services')}>
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Back to Services
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push(`/admin/dashboard/services/${serviceId}`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Reschedule Service</h1>
                </div>
            </div>
            
            <Alert>
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>You are rescheduling a service appointment</AlertTitle>
                <AlertDescription>
                    Rescheduling this service will send a notification to both the customer and any assigned employee.
                </AlertDescription>
            </Alert>
            
            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Appointment</CardTitle>
                            <CardDescription>
                                Details of the currently scheduled service
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
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
                                    <p className="text-sm font-medium">Current Date</p>
                                    <p className="text-sm">
                                        {format(parseISO(service.scheduledDate), 'PPP')}
                                    </p>
                                </div>
                                <Separator />
                                
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium">Current Time</p>
                                    <p className="text-sm">
                                        {format(parseISO(service.scheduledDate), 'p')}
                                    </p>
                                </div>
                                <Separator />
                                
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium">Current Duration</p>
                                    <p className="text-sm">{service.duration} minutes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>New Appointment</CardTitle>
                            <CardDescription>
                                Select a new date and time for this service
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground",
                                                errors.date && "border-destructive"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4"/>
                                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.date && (
                                    <p className="text-sm text-destructive">Date is required</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>New Time</Label>
                                <Select value={timeSlot} onValueChange={setTimeSlot}>
                                    <SelectTrigger className={cn(errors.timeSlot && "border-destructive")}>
                                        <SelectValue placeholder="Select time">
                                            {timeSlot ? getTimeDisplay(timeSlot) : "Select time"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_SLOTS.map((slot) => (
                                            <SelectItem key={slot} value={slot}>
                                                {getTimeDisplay(slot)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.timeSlot && (
                                    <p className="text-sm text-destructive">Time is required</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Duration</Label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger className={cn(errors.duration && "border-destructive")}>
                                        <SelectValue placeholder="Select duration"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DURATION_OPTIONS.map((option) => (
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

                            <div className="space-y-2">
                                <Label>Reason for Rescheduling</Label>
                                <Textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason for rescheduling..."
                                    className="h-32"
                                />
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
                                {isSubmitting ? 'Rescheduling...' : 'Reschedule Service'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    );
}
