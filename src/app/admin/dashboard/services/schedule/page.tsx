'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, ArrowLeft, User } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

interface ServiceType {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
}

export default function ScheduleServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  
  // Derived data
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/dashboard/services/schedule');
      return;
    }
    
    // Verify user is an admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Load data
    fetchCustomers();
    fetchEmployees();
    fetchServiceTypes();
    setIsLoading(false);
  }, [status, session, router]);

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
      // In a real app, fetch from API
      // Mock data for demonstration
      const mockCustomers: Customer[] = [
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
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      // In a real app, fetch from API
      // Mock data for demonstration
      const mockEmployees: Employee[] = [
        {
          id: '201',
          name: 'David Miller',
          email: 'david.miller@scoopify.com',
          role: 'EMPLOYEE',
          availability: [
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' }
          ]
        },
        {
          id: '202',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@scoopify.com',
          role: 'EMPLOYEE',
          availability: [
            { day: 'Monday', startTime: '10:00', endTime: '18:00' },
            { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
            { day: 'Wednesday', startTime: '10:00', endTime: '18:00' },
            { day: 'Thursday', startTime: '10:00', endTime: '18:00' },
            { day: 'Friday', startTime: '10:00', endTime: '18:00' }
          ]
        },
        {
          id: '203',
          name: 'Tom Wilson',
          email: 'tom.wilson@scoopify.com',
          role: 'EMPLOYEE',
          availability: [
            { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
            { day: 'Wednesday', startTime: '08:00', endTime: '16:00' },
            { day: 'Thursday', startTime: '08:00', endTime: '16:00' },
            { day: 'Friday', startTime: '08:00', endTime: '16:00' },
            { day: 'Saturday', startTime: '09:00', endTime: '15:00' }
          ]
        },
        {
          id: '204',
          name: 'Emily Davis',
          email: 'emily.davis@scoopify.com',
          role: 'EMPLOYEE',
          availability: [
            { day: 'Monday', startTime: '11:00', endTime: '19:00' },
            { day: 'Wednesday', startTime: '11:00', endTime: '19:00' },
            { day: 'Friday', startTime: '11:00', endTime: '19:00' },
            { day: 'Saturday', startTime: '10:00', endTime: '16:00' },
            { day: 'Sunday', startTime: '10:00', endTime: '16:00' }
          ]
        }
      ];
      
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      // In a real app, fetch from API
      // Mock data for demonstration
      const mockServiceTypes: ServiceType[] = [
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
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const handleCreateNewCustomer = () => {
    router.push('/admin/dashboard/customers/new?returnTo=/admin/dashboard/services/schedule');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!customerId || !serviceTypeId || !date || !time) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real app, post to API
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Service Scheduled",
        description: "The service has been successfully scheduled.",
      });
      
      router.push('/admin/dashboard/services');
    } catch (error) {
      console.error('Error scheduling service:', error);
      toast({
        title: "Error",
        description: "Failed to schedule service. Please try again.",
        variant: "destructive"
      });
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
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/dashboard/services')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Schedule New Service</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Select an existing customer or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <div className="flex gap-2">
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={handleCreateNewCustomer}>
                      New
                    </Button>
                  </div>
                </div>
                
                {selectedCustomer && (
                  <div className="border rounded-md p-4 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm">{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm">{selectedCustomer.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Select the service type and schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} - ${type.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedServiceType && (
                  <div className="border rounded-md p-4 space-y-2">
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {selectedServiceType.duration} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm">{selectedServiceType.description}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-8"
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        id="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Assign an employee to this service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee (Optional)</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {employee.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes about this service..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            className="mr-2"
            onClick={() => router.push('/admin/dashboard/services')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scheduling...
              </>
            ) : 'Schedule Service'}
          </Button>
        </div>
      </form>
    </div>
  );
} 