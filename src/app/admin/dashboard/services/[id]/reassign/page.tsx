'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Search, AlertCircle, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Service {
  id: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  duration: number;
  price: number;
  notes: string;
  customer: {
    id: string;
    name: string;
    address: string;
  };
  serviceType: {
    id: string;
    name: string;
  };
  assignedEmployee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  skills: string[];
  rating: number;
  jobsCompleted: number;
  available: boolean;
  scheduleConflict: boolean;
}

export default function ReassignEmployeePage() {
  const params = useParams();
  const serviceId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifyEmployee, setNotifyEmployee] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/admin/dashboard/services/${serviceId}/reassign`);
      return;
    }
    
    // Check if user is admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      return;
    }

    if (status === 'authenticated') {
      fetchServiceDetails();
      fetchEmployees();
    }
  }, [status, session, router, serviceId, toast]);

  const fetchServiceDetails = async () => {
    try {
      // In a real app, fetch from API
      // Mock data for demonstration
      const mockService: Service = {
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
    } catch (error) {
      console.error('Error fetching service:', error);
      toast({
        title: "Error",
        description: "Failed to load service details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // In a real app, fetch from API
      // Mock data for demonstration
      const mockEmployees: Employee[] = [
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
      setFilteredEmployees(showOnlyAvailable 
        ? mockEmployees.filter(emp => emp.available) 
        : mockEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employee list. Please try again.",
        variant: "destructive"
      });
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

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee to assign.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send this to your API
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      
      // Show success message
      toast({
        title: "Employee Reassigned",
        description: `${selectedEmployee?.name} has been assigned to this service.`,
      });
      
      // Redirect back to service details
      router.push(`/admin/dashboard/services/${serviceId}`);
    } catch (error) {
      console.error('Error reassigning employee:', error);
      toast({
        title: "Error",
        description: "Failed to reassign employee. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingStars = (rating: number) => {
    // Convert rating to stars (★ filled, ☆ empty)
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (halfStar) stars += '½';
    
    return stars;
  };

  const getInitials = (name: string) => {
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
          <ArrowLeft className="h-4 w-4 mr-2" />
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
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Reassign Employee</h1>
        </div>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>You are reassigning an employee to this service</AlertTitle>
        <AlertDescription>
          This will remove the current assignment and notify the employees affected by this change.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Information about the service appointment
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
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm truncate max-w-[180px]" title={service.customer.address}>
                  {service.customer.address}
                </p>
              </div>
              <Separator />
              
              <div className="flex justify-between">
                <p className="text-sm font-medium">Current Employee</p>
                <p className="text-sm">
                  {service.assignedEmployee ? service.assignedEmployee.name : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assign Employee</CardTitle>
            <CardDescription>
              Select an employee to assign to this service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employees..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-available" 
                  checked={showOnlyAvailable} 
                  onCheckedChange={(checked) => setShowOnlyAvailable(checked as boolean)}
                />
                <Label htmlFor="show-available">Show only available</Label>
              </div>
            </div>
            
            <div className="border rounded-md">
              {filteredEmployees.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No employees found</p>
                  {showOnlyAvailable && (
                    <Button 
                      variant="link" 
                      onClick={() => setShowOnlyAvailable(false)}
                    >
                      Show all employees
                    </Button>
                  )}
                </div>
              ) : (
                <RadioGroup 
                  value={selectedEmployeeId} 
                  onValueChange={handleEmployeeSelect}
                  className="divide-y"
                >
                  {filteredEmployees.map((employee) => (
                    <div 
                      key={employee.id} 
                      className={`p-4 flex items-start space-x-4 ${!employee.available ? 'bg-muted/30' : ''}`}
                    >
                      <RadioGroupItem value={employee.id} id={employee.id} className="mt-1" />
                      <div className="flex-grow flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            {employee.avatar ? (
                              <AvatarImage src={employee.avatar} alt={employee.name} />
                            ) : null}
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                        <div className="sm:ml-auto space-y-1 sm:text-right">
                          <div className="text-sm">
                            <span className="text-amber-500 font-medium mr-1">
                              {getRatingStars(employee.rating)}
                            </span>
                            <span className="text-muted-foreground">
                              ({employee.rating.toFixed(1)})
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {employee.jobsCompleted} jobs completed
                          </p>
                          <div className="flex gap-2 sm:justify-end">
                            {employee.scheduleConflict && (
                              <Badge variant="outline" className="text-xs border-destructive text-destructive">
                                Schedule Conflict
                              </Badge>
                            )}
                            {employee.available ? (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                                Available
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Reassignment (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're reassigning this service..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-employee" 
                  checked={notifyEmployee} 
                  onCheckedChange={(checked) => setNotifyEmployee(checked as boolean)}
                />
                <Label htmlFor="notify-employee">Notify assigned employee</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-customer" 
                  checked={notifyCustomer} 
                  onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
                />
                <Label htmlFor="notify-customer">Notify customer</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/admin/dashboard/services/${serviceId}`)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedEmployeeId}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Assign Employee
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 