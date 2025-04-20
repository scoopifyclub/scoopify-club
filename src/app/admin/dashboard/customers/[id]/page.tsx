'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Phone, Home, Calendar, CreditCard, ClipboardList, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastService: string;
  totalSpent: number;
  servicesCount: number;
  serviceHistory?: {
    id: string;
    date: string;
    type: string;
    status: string;
    price: number;
    employee: string;
  }[];
  upcomingServices?: {
    id: string;
    date: string;
    type: string;
    price: number;
  }[];
  paymentMethods?: {
    id: string;
    type: string;
    last4: string;
    expiry: string;
    isDefault: boolean;
  }[];
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/admin/dashboard/customers/${customerId}`);
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchCustomerDetails();
    }
  }, [status, session, router, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      // Mock data for demonstration
      const mockCustomer: Customer = {
        id: customerId,
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Anytown, CA 94568',
        status: 'active',
        joinDate: '2023-01-15',
        lastService: '2023-11-20',
        totalSpent: 750.50,
        servicesCount: 12,
        serviceHistory: [
          {
            id: '1',
            date: '2023-11-20T10:00:00Z',
            type: 'Regular Cleaning',
            status: 'completed',
            price: 85.00,
            employee: 'David Miller'
          },
          {
            id: '2',
            date: '2023-10-15T09:30:00Z',
            type: 'Deep Cleaning',
            status: 'completed',
            price: 120.00,
            employee: 'Sarah Johnson'
          },
          {
            id: '3',
            date: '2023-09-10T14:00:00Z',
            type: 'Regular Cleaning',
            status: 'completed',
            price: 85.00,
            employee: 'David Miller'
          }
        ],
        upcomingServices: [
          {
            id: '4',
            date: '2023-12-10T10:00:00Z',
            type: 'Regular Cleaning',
            price: 85.00
          }
        ],
        paymentMethods: [
          {
            id: '1',
            type: 'visa',
            last4: '4242',
            expiry: '04/25',
            isDefault: true
          },
          {
            id: '2',
            type: 'mastercard',
            last4: '5555',
            expiry: '08/24',
            isDefault: false
          }
        ]
      };
      
      setCustomer(mockCustomer);
      setEditFormData({
        name: mockCustomer.name,
        email: mockCustomer.email,
        phone: mockCustomer.phone,
        address: mockCustomer.address,
      });
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast({
        title: "Error",
        description: "Failed to load customer details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!customer) return;
    
    setIsSubmitting(true);
    
    try {
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          address: editFormData.address,
        };
      });
      
      setIsEditDialogOpen(false);
      
      toast({
        title: "Customer Updated",
        description: "The customer information has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'pending') => {
    if (!customer) return;
    
    try {
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus
        };
      });
      
      setIsDeactivateDialogOpen(false);
      
      toast({
        title: "Status Updated",
        description: `Customer status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast({
        title: "Error",
        description: "Failed to update customer status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Customer Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The customer you are looking for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push('/admin/dashboard/customers')}>
                Return to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-2">Customer</Badge>
              {getStatusBadge(customer.status)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin/dashboard/services/schedule?customer=${customer.id}`)}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Schedule Service
          </Button>
          {customer.status === 'active' ? (
            <Button variant="destructive" onClick={() => setIsDeactivateDialogOpen(true)}>
              Deactivate
            </Button>
          ) : (
            <Button variant="default" onClick={() => handleStatusChange('active')}>
              Activate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{customer.address}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Customer Since</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(customer.joinDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.paymentMethods && customer.paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {customer.paymentMethods.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium capitalize">{payment.type}</p>
                        <p className="text-xs text-muted-foreground">
                          •••• {payment.last4} | Expires {payment.expiry}
                        </p>
                      </div>
                    </div>
                    {payment.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No payment methods available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold">${customer.totalSpent.toFixed(2)}</p>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">Services Completed</p>
                <p className="text-xl font-bold">{customer.servicesCount}</p>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">Last Service</p>
                <p className="text-sm font-medium">
                  {customer.lastService ? format(new Date(customer.lastService), 'MMMM d, yyyy') : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="services">Service History</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>Past services for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.serviceHistory && customer.serviceHistory.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Employee</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {customer.serviceHistory.map((service) => (
                        <tr 
                          key={service.id} 
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                          onClick={() => router.push(`/admin/dashboard/services/${service.id}`)}
                        >
                          <td className="p-4 align-middle">
                            {format(parseISO(service.date), 'MMM d, yyyy')}
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(service.date), 'h:mm a')}
                            </div>
                          </td>
                          <td className="p-4 align-middle font-medium">{service.type}</td>
                          <td className="p-4 align-middle">{service.employee}</td>
                          <td className="p-4 align-middle">
                            <Badge className={
                              service.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              service.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right">${service.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No service history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
              <CardDescription>Scheduled services for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.upcomingServices && customer.upcomingServices.length > 0 ? (
                <div className="space-y-4">
                  {customer.upcomingServices.map(service => (
                    <div key={service.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{service.type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(service.date), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(service.date), 'h:mm a')}
                          </p>
                        </div>
                        <p className="font-medium">${service.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/dashboard/services/${service.id}`);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/dashboard/services/${service.id}/reschedule`);
                          }}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No upcoming services scheduled</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push(`/admin/dashboard/services/schedule?customer=${customer.id}`)}
                  >
                    Schedule Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={editFormData.address}
                onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Customer Dialog */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this customer? They will no longer be able to book services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground"
              onClick={() => handleStatusChange('inactive')}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 