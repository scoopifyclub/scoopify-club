'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, User, Phone, Mail, ClipboardEdit, ArrowRight, AlertTriangle } from 'lucide-react';
import { format, parseISO, addHours } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

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
    email: string;
    phone: string;
    address: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  serviceType: {
    id: string;
    name: string;
    description: string;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

export default function ServiceDetailsPage() {
  const params = useParams();
  const serviceId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/admin/dashboard/services/${serviceId}`);
      return;
    }
    
    // Verify user is an admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchServiceDetails();
      fetchEmployees();
    }
  }, [status, session, router, serviceId]);

  const fetchServiceDetails = async () => {
    try {
      // In a real app, fetch from API using serviceId
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
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St, Anytown, CA 94587'
        },
        employee: {
          id: '201',
          name: 'David Miller',
          email: 'david.miller@scoopify.com'
        },
        serviceType: {
          id: '301',
          name: 'Regular Cleaning',
          description: 'Standard cleaning service including dusting, vacuuming, mopping, and bathroom cleaning.'
        }
      };
      
      setService(mockService);
      setSelectedEmployee(mockService.employee?.id || '');
      setUpdateNotes(mockService.notes);
    } catch (error) {
      console.error('Error fetching service details:', error);
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
          id: '201',
          name: 'David Miller',
          email: 'david.miller@scoopify.com'
        },
        {
          id: '202',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@scoopify.com'
        },
        {
          id: '203',
          name: 'Tom Wilson',
          email: 'tom.wilson@scoopify.com'
        },
        {
          id: '204',
          name: 'Emily Davis',
          email: 'emily.davis@scoopify.com'
        }
      ];
      
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleUpdateService = async () => {
    if (!service) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, post to API
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to reflect changes
      setService(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          notes: updateNotes,
          employee: selectedEmployee 
            ? employees.find(e => e.id === selectedEmployee) || null 
            : null
        };
      });
      
      setIsDialogOpen(false);
      
      toast({
        title: "Service Updated",
        description: "The service has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelService = async () => {
    if (!service) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, post to API
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to reflect cancellation
      setService(prev => {
        if (!prev) return null;
        return { ...prev, status: 'cancelled' };
      });
      
      toast({
        title: "Service Cancelled",
        description: "The service has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling service:', error);
      toast({
        title: "Error",
        description: "Failed to cancel service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteService = async () => {
    if (!service) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, post to API
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to reflect completion
      setService(prev => {
        if (!prev) return null;
        return { ...prev, status: 'completed' };
      });
      
      toast({
        title: "Service Completed",
        description: "The service has been marked as completed.",
      });
    } catch (error) {
      console.error('Error completing service:', error);
      toast({
        title: "Error",
        description: "Failed to mark service as completed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Scheduled</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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

  const endTime = addHours(parseISO(service.scheduledDate), service.duration / 60);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/dashboard/services')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Service Details</h1>
          {getStatusBadge(service.status)}
        </div>
        
        <div className="flex gap-2">
          {service.status === 'scheduled' && (
            <>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ClipboardEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Service</DialogTitle>
                    <DialogDescription>
                      Make changes to the service appointment.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Assigned Employee</Label>
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={updateNotes}
                        onChange={(e) => setUpdateNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateService} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cancel Service
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the service appointment. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep it</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelService}
                      disabled={isSubmitting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isSubmitting ? 'Cancelling...' : 'Yes, cancel it'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {service.status === 'in-progress' && (
            <Button onClick={handleCompleteService} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : 'Mark as Completed'}
            </Button>
          )}
          
          {service.status === 'scheduled' && (
            <Button onClick={() => router.push(`/admin/dashboard/services/${serviceId}/reschedule`)}>
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Service Type</p>
                <p className="text-sm">{service.serviceType.name}</p>
              </div>
              <Separator />
              
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  Date
                </p>
                <p className="text-sm">{format(parseISO(service.scheduledDate), 'MMMM d, yyyy')}</p>
              </div>
              <Separator />
              
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  Time
                </p>
                <p className="text-sm">
                  {format(parseISO(service.scheduledDate), 'h:mm a')} - {format(endTime, 'h:mm a')}
                </p>
              </div>
              <Separator />
              
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  Duration
                </p>
                <p className="text-sm">{service.duration} minutes</p>
              </div>
              <Separator />
              
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                  Price
                </p>
                <p className="text-sm">${service.price.toFixed(2)}</p>
              </div>
              <Separator />
              
              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm bg-secondary p-3 rounded-md">{service.notes || 'No notes provided.'}</p>
              </div>
            </div>
          </CardContent>
          {service.serviceType.description && (
            <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              <p>{service.serviceType.description}</p>
            </CardFooter>
          )}
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-1 text-muted-foreground" />
                    Name
                  </p>
                  <p className="text-sm font-medium">{service.customer.name}</p>
                </div>
                <Separator />
                
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                    Email
                  </p>
                  <p className="text-sm">
                    <a href={`mailto:${service.customer.email}`} className="text-primary underline-offset-4 hover:underline">
                      {service.customer.email}
                    </a>
                  </p>
                </div>
                <Separator />
                
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                    Phone
                  </p>
                  <p className="text-sm">
                    <a href={`tel:${service.customer.phone}`} className="text-primary underline-offset-4 hover:underline">
                      {service.customer.phone}
                    </a>
                  </p>
                </div>
                <Separator />
                
                <div>
                  <p className="text-sm font-medium flex items-center mb-1">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    Address
                  </p>
                  <p className="text-sm bg-secondary p-3 rounded-md">
                    {service.customer.address}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push(`/admin/dashboard/customers/${service.customer.id}`)}
              >
                View Customer Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Employee Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {service.employee ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-1 text-muted-foreground" />
                      Name
                    </p>
                    <p className="text-sm font-medium">{service.employee.name}</p>
                  </div>
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-muted-foreground" />
                      Email
                    </p>
                    <p className="text-sm">
                      <a href={`mailto:${service.employee.email}`} className="text-primary underline-offset-4 hover:underline">
                        {service.employee.email}
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No employee assigned yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={() => setIsDialogOpen(true)}
                    disabled={service.status !== 'scheduled'}
                  >
                    Assign Employee
                  </Button>
                </div>
              )}
            </CardContent>
            {service.employee && (
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push(`/admin/dashboard/employees/${service.employee?.id}`)}
                >
                  View Employee Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 