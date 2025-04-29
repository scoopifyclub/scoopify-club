'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Phone, Home, Calendar, CreditCard, ClipboardList, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerDetailsPage() {
    const params = useParams();
    const customerId = params.id;
    const { user, loading } = useAuth({ required: true, role: 'ADMIN' });
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
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
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchCustomerDetails();
        }
    }, [loading, user]);

    const fetchCustomerDetails = async () => {
        try {
            const response = await fetch(`/api/admin/customers/${customerId}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch customer details');
            }

            const data = await response.json();
            setCustomer(data.customer);
            setEditFormData({
                name: data.customer.name,
                email: data.customer.email,
                phone: data.customer.phone,
                address: data.customer.address,
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
            const response = await fetch(`/api/admin/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editFormData)
            });

            if (!response.ok) {
                throw new Error('Failed to update customer');
            }

            const data = await response.json();
            setCustomer(data.customer);
            setIsEditDialogOpen(false);
            toast({
                title: "Success",
                description: "Customer information has been updated successfully.",
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

    const handleStatusChange = async (newStatus) => {
        if (!customer) return;
        try {
            const response = await fetch(`/api/admin/customers/${customerId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update customer status');
            }

            const data = await response.json();
            setCustomer(prev => ({ ...prev, status: newStatus }));
            setIsDeactivateDialogOpen(false);
            toast({
                title: "Success",
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

    const getStatusBadge = (status) => {
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

    if (loading || isLoading) {
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
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Customer Not Found</h1>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
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
                        <ArrowLeft className="h-4 w-4 mr-2"/>
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
                        <User className="h-4 w-4 mr-2"/>
                        Edit Customer
                    </Button>
                    {customer.status === 'active' ? (
                        <Button variant="destructive" onClick={() => setIsDeactivateDialogOpen(true)}>
                            Deactivate Account
                        </Button>
                    ) : (
                        <Button variant="default" onClick={() => handleStatusChange('active')}>
                            Activate Account
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center">
                                <Home className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <span>{customer.address}</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground"/>
                                <span>Joined {format(parseISO(customer.joinDate), 'PP')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Services</span>
                                <span className="font-medium">{customer.servicesCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Spent</span>
                                <span className="font-medium">
                                    ${customer.totalSpent.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Service</span>
                                <span className="font-medium">
                                    {format(parseISO(customer.lastService), 'PP')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Customer Information</DialogTitle>
                        <DialogDescription>
                            Make changes to the customer's information here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    email: e.target.value
                                }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    phone: e.target.value
                                }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={editFormData.address}
                                onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    address: e.target.value
                                }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Customer Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to deactivate this customer's account? They will no longer be able to book services until reactivated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleStatusChange('inactive')}>
                            Deactivate Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
