'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Search, AlertCircle, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ReassignEmployeePage() {
    const params = useParams();
    const serviceId = params.id;
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [service, setService] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifyEmployee, setNotifyEmployee] = useState(true);
    const [notifyCustomer, setNotifyCustomer] = useState(true);
    const [reason, setReason] = useState('');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchServiceDetails();
            fetchEmployees();
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

            // If there's already an assigned employee, pre-select them
            if (data.assignedEmployee) {
                setSelectedEmployeeId(data.assignedEmployee.id);
            }
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
                        name: 'John Smith',
                        address: '123 Main St, Anytown, USA'
                    },
                    serviceType: {
                        id: '301',
                        name: 'Regular Cleaning'
                    },
                    assignedEmployee: {
                        id: 'emp-123',
                        name: 'Sarah Johnson',
                        email: 'sarah.j@example.com'
                    }
                };
                setService(mockService);
                
                // If there's already an assigned employee, pre-select them
                if (mockService.assignedEmployee) {
                    setSelectedEmployeeId(mockService.assignedEmployee.id);
                }
            }
        } finally {
            setIsLoading(false);
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
            setFilteredEmployees(showOnlyAvailable ? data.filter(emp => emp.available) : data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employee list');

            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                const mockEmployees = [
                    {
                        id: 'emp-123',
                        name: 'Sarah Johnson',
                        email: 'sarah.j@example.com',
                        skills: ['Regular Cleaning', 'Deep Cleaning'],
                        rating: 4.8,
                        jobsCompleted: 124,
                        available: false,
                        scheduleConflict: true
                    },
                    {
                        id: 'emp-456',
                        name: 'Michael Torres',
                        email: 'michael.t@example.com',
                        avatar: '/avatars/michael.jpg',
                        skills: ['Regular Cleaning', 'Window Cleaning', 'Move-out Cleaning'],
                        rating: 4.9,
                        jobsCompleted: 86,
                        available: true,
                        scheduleConflict: false
                    },
                    {
                        id: 'emp-789',
                        name: 'Ava Williams',
                        email: 'ava.w@example.com',
                        skills: ['Regular Cleaning', 'Deep Cleaning', 'Office Cleaning'],
                        rating: 4.7,
                        jobsCompleted: 92,
                        available: true,
                        scheduleConflict: false
                    },
                    {
                        id: 'emp-987',
                        name: 'David Chen',
                        email: 'david.c@example.com',
                        avatar: '/avatars/david.jpg',
                        skills: ['Deep Cleaning', 'Move-out Cleaning', 'Post-construction Cleaning'],
                        rating: 4.5,
                        jobsCompleted: 57,
                        available: true,
                        scheduleConflict: false
                    },
                    {
                        id: 'emp-654',
                        name: 'Emma Rodriguez',
                        email: 'emma.r@example.com',
                        skills: ['Regular Cleaning', 'Office Cleaning'],
                        rating: 4.6,
                        jobsCompleted: 73,
                        available: false,
                        scheduleConflict: true
                    }
                ];
                setEmployees(mockEmployees);
                setFilteredEmployees(showOnlyAvailable ? mockEmployees.filter(emp => emp.available) : mockEmployees);
            }
        }
    };

    // Filter employees based on search query and availability toggle
    useEffect(() => {
        let filtered = employees;
        if (searchQuery) {
            filtered = filtered.filter(emp => 
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (showOnlyAvailable) {
            filtered = filtered.filter(emp => emp.available);
        }
        setFilteredEmployees(filtered);
    }, [searchQuery, employees, showOnlyAvailable]);

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployeeId(employeeId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedEmployeeId) {
            toast.error('Please select an employee to assign');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/admin/services/${serviceId}/reassign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    employeeId: selectedEmployeeId,
                    reason,
                    notifyEmployee,
                    notifyCustomer
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reassign employee');
            }

            const data = await response.json();
            const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
            
            toast.success(`${selectedEmployee?.name} has been assigned to this service`);
            router.push(`/admin/dashboard/services/${serviceId}`);
        } catch (error) {
            console.error('Error reassigning employee:', error);
            toast.error('Failed to reassign employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRatingStars = (rating) => {
        // Convert rating to stars (★ filled, ☆ empty)
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (halfStar) stars += '½';
        return stars;
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
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
                    <h1 className="text-2xl font-bold tracking-tight">Reassign Employee</h1>
                </div>
            </div>
            
            <Alert>
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>You are reassigning an employee to this service</AlertTitle>
                <AlertDescription>
                    This will remove the current assignment and notify the employees affected by this change.
                </AlertDescription>
            </Alert>
            
            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Details</CardTitle>
                            <CardDescription>
                                Current service information
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
                                    <p className="text-sm font-medium">Duration</p>
                                    <p className="text-sm">{service.duration} minutes</p>
                                </div>
                                <Separator />
                                
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium">Current Employee</p>
                                    <p className="text-sm">
                                        {service.assignedEmployee?.name || 'None'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Selection</CardTitle>
                            <CardDescription>
                                Choose a new employee to assign
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="showAvailable"
                                        checked={showOnlyAvailable}
                                        onCheckedChange={setShowOnlyAvailable}
                                    />
                                    <Label htmlFor="showAvailable">Available only</Label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <RadioGroup value={selectedEmployeeId} onValueChange={handleEmployeeSelect}>
                                    {filteredEmployees.map((employee) => (
                                        <div
                                            key={employee.id}
                                            className={cn(
                                                "flex items-center space-x-4 rounded-lg border p-4",
                                                selectedEmployeeId === employee.id && "border-primary bg-primary/5",
                                                !employee.available && "opacity-50"
                                            )}
                                        >
                                            <RadioGroupItem value={employee.id} id={employee.id} />
                                            <Label
                                                htmlFor={employee.id}
                                                className="flex flex-1 items-center justify-between cursor-pointer"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Avatar>
                                                        <AvatarImage src={employee.avatar} />
                                                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{employee.name}</p>
                                                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm">
                                                        {getRatingStars(employee.rating)} ({employee.rating})
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {employee.jobsCompleted} jobs completed
                                                    </div>
                                                    <div className="mt-1">
                                                        {employee.scheduleConflict ? (
                                                            <Badge variant="destructive">Schedule Conflict</Badge>
                                                        ) : employee.available ? (
                                                            <Badge variant="success">Available</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Unavailable</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Reason for Reassignment</Label>
                                    <Textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Enter reason for reassignment..."
                                        className="h-32"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="notifyEmployee"
                                            checked={notifyEmployee}
                                            onCheckedChange={setNotifyEmployee}
                                        />
                                        <Label htmlFor="notifyEmployee">
                                            Notify employees about this change
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="notifyCustomer"
                                            checked={notifyCustomer}
                                            onCheckedChange={setNotifyCustomer}
                                        />
                                        <Label htmlFor="notifyCustomer">
                                            Notify customer about this change
                                        </Label>
                                    </div>
                                </div>
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
                                {isSubmitting ? 'Reassigning...' : 'Reassign Employee'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    );
}
