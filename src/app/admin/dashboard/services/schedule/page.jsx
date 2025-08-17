'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, ArrowLeft, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ScheduleServicePage() {
    const router = useRouter();
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form data
    const [customerId, setCustomerId] = useState('');
    const [serviceTypeId, setServiceTypeId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    
    // Options for selects
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    
    // Derived data
    const [selectedServiceType, setSelectedServiceType] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        if (status === 'authenticated') {
            // Load data
            Promise.all([
                fetchCustomers(),
                fetchEmployees(),
                fetchServiceTypes()
            ]).then(() => {
                setIsLoading(false);
            }).catch(error => {
                console.error('Error loading data:', error);
                toast.error('Failed to load required data');
                setIsLoading(false);
            });
        }
    }, [status]);

    // Update selected service type when serviceTypeId changes
    useEffect(() => {
        if (serviceTypeId) {
            const selected = serviceTypes.find(type => type.id === serviceTypeId) || null;
            setSelectedServiceType(selected);
        } else {
            setSelectedServiceType(null);
        }
    }, [serviceTypeId, serviceTypes]);

    // Update selected customer when customerId changes
    useEffect(() => {
        if (customerId) {
            const selected = customers.find(customer => customer.id === customerId) || null;
            setSelectedCustomer(selected);
        } else {
            setSelectedCustomer(null);
        }
    }, [customerId, customers]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/admin/customers', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }

            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to fetch customers');
            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                const mockCustomers = [
                    {
                        id: '101',
                        name: 'John Smith',
                        email: 'john.smith@example.com',
                        phone: '(555) 123-4567',
                        address: '123 Main St, Anytown, CA 94587'
                    },
                    {
                        id: '102',
                        name: 'Emily Wilson',
                        email: 'emily.wilson@example.com',
                        phone: '(555) 987-6543',
                        address: '456 Oak Ave, Someville, CA 94588'
                    },
                    {
                        id: '103',
                        name: 'Robert Johnson',
                        email: 'robert.johnson@example.com',
                        phone: '(555) 456-7890',
                        address: '789 Pine Rd, Othertown, CA 94589'
                    },
                    {
                        id: '104',
                        name: 'Jennifer Lee',
                        email: 'jennifer.lee@example.com',
                        phone: '(555) 789-0123',
                        address: '101 Maple Dr, Newcity, CA 94590'
                    },
                    {
                        id: '105',
                        name: 'Michael Brown',
                        email: 'michael.brown@example.com',
                        phone: '(555) 234-5678',
                        address: '202 Cedar Ln, Oldtown, CA 94591'
                    }
                ];
                setCustomers(mockCustomers);
            }
            throw error;
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/admin/employees', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees');
            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                // Example available employees (replace with real data)
                const availableEmployees = [
                    {
                        id: 'emp_1',
                        name: 'John Smith',
                        email: 'employee1@example.com',
                        rating: 4.8,
                        completedServices: 45,
                        availability: 'Available'
                    },
                    {
                        id: 'emp_2',
                        name: 'Emily Wilson',
                        email: 'employee2@example.com',
                        rating: 4.6,
                        completedServices: 32,
                        availability: 'Available'
                    },
                    {
                        id: 'emp_3',
                        name: 'Robert Johnson',
                        email: 'employee3@example.com',
                        rating: 4.9,
                        completedServices: 67,
                        availability: 'Available'
                    },
                    {
                        id: 'emp_4',
                        name: 'Jennifer Lee',
                        email: 'employee4@example.com',
                        rating: 4.7,
                        completedServices: 28,
                        availability: 'Available'
                    },
                    {
                        id: 'emp_5',
                        name: 'Michael Brown',
                        email: 'employee5@example.com',
                        rating: 4.5,
                        completedServices: 41,
                        availability: 'Available'
                    }
                ];
                setEmployees(availableEmployees);
            }
            throw error;
        }
    };

    const fetchServiceTypes = async () => {
        try {
            const response = await fetch('/api/admin/service-types', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch service types');
            }

            const data = await response.json();
            setServiceTypes(data);
        } catch (error) {
            console.error('Error fetching service types:', error);
            toast.error('Failed to fetch service types');
            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                const mockServiceTypes = [
                    {
                        id: '301',
                        name: 'Regular Cleaning',
                        price: 85.00,
                        duration: 120,
                        description: 'Standard cleaning service including dusting, vacuuming, mopping, and bathroom cleaning.'
                    },
                    {
                        id: '302',
                        name: 'Deep Cleaning',
                        price: 150.00,
                        duration: 180,
                        description: 'Thorough cleaning of all surfaces, including areas normally missed in regular cleaning.'
                    },
                    {
                        id: '303',
                        name: 'Window Cleaning',
                        price: 65.00,
                        duration: 90,
                        description: 'Cleaning of interior and exterior windows, including frames and sills.'
                    },
                    {
                        id: '304',
                        name: 'Move-out Cleaning',
                        price: 200.00,
                        duration: 240,
                        description: 'Comprehensive cleaning service for when you\'re moving out of a property.'
                    },
                    {
                        id: '305',
                        name: 'Carpet Cleaning',
                        price: 120.00,
                        duration: 120,
                        description: 'Professional cleaning of carpets using specialized equipment.'
                    }
                ];
                setServiceTypes(mockServiceTypes);
            }
            throw error;
        }
    };

    const handleCreateNewCustomer = () => {
        router.push('/admin/dashboard/customers/new?returnTo=/admin/dashboard/services/schedule');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!customerId || !serviceTypeId || !employeeId || !date || !time) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);

            const scheduledDate = new Date(`${date}T${time}`);
            
            const response = await fetch('/api/admin/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    customerId,
                    serviceTypeId,
                    employeeId,
                    scheduledDate: scheduledDate.toISOString(),
                    notes
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to schedule service');
            }

            const data = await response.json();
            toast.success('Service scheduled successfully');
            router.push(`/admin/dashboard/services/${data.id}`);
        } catch (error) {
            console.error('Error scheduling service:', error);
            toast.error('Failed to schedule service');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Schedule New Service</CardTitle>
                    <CardDescription>Create a new service appointment</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Selection */}
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <div className="flex gap-2">
                                    <Select 
                                        value={customerId} 
                                        onValueChange={setCustomerId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem 
                                                    key={customer.id} 
                                                    value={customer.id}
                                                >
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={handleCreateNewCustomer}
                                    >
                                        New
                                    </Button>
                                </div>
                                {selectedCustomer && (
                                    <div className="text-sm text-muted-foreground">
                                        <div>{selectedCustomer.address}</div>
                                        <div>{selectedCustomer.phone}</div>
                                    </div>
                                )}
                            </div>

                            {/* Service Type Selection */}
                            <div className="space-y-2">
                                <Label>Service Type</Label>
                                <Select 
                                    value={serviceTypeId} 
                                    onValueChange={setServiceTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a service type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceTypes.map((type) => (
                                            <SelectItem 
                                                key={type.id} 
                                                value={type.id}
                                            >
                                                {type.name} - ${type.price}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedServiceType && (
                                    <div className="text-sm text-muted-foreground">
                                        <div>{selectedServiceType.description}</div>
                                        <div>Duration: {selectedServiceType.duration} minutes</div>
                                    </div>
                                )}
                            </div>

                            {/* Employee Selection */}
                            <div className="space-y-2">
                                <Label>Employee</Label>
                                <Select 
                                    value={employeeId} 
                                    onValueChange={setEmployeeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((employee) => (
                                            <SelectItem 
                                                key={employee.id} 
                                                value={employee.id}
                                            >
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date and Time Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="pl-10"
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any special instructions or notes..."
                                className="h-32"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Scheduling...' : 'Schedule Service'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
