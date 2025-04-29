'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, UserCog, Mail, Phone, Calendar, MapPin, Star, CheckCircle2, ClipboardList, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function EmployeeDetailsPage() {
    var _a, _b, _c, _d, _e, _f, _g;
    const params = useParams();
    const employeeId = params.id;
    const { user, loading } = useAuth({ required: true, role: 'ADMIN' });
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [employee, setEmployee] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        serviceAreas: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchEmployeeDetails();
        }
    }, [loading, user]);
    const fetchEmployeeDetails = async () => {
        try {
            const response = await fetch(`/api/employees/${employeeId}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employee details');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch employee details');
            }

            setEmployee(data.employee);
            setEditFormData({
                name: data.employee.name,
                email: data.employee.email,
                phone: data.employee.phone,
                role: data.employee.role,
                serviceAreas: data.employee.serviceAreas,
            });
        } catch (error) {
            console.error('Error fetching employee details:', error);
            toast({
                title: "Error",
                description: "Failed to load employee details. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    const handleUpdate = async () => {
        if (!employee)
            return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/employees/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editFormData)
            });

            if (!response.ok) {
                throw new Error('Failed to update employee');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update employee');
            }

            setEmployee(data.employee);
            setIsEditDialogOpen(false);
            toast({
                title: "Success",
                description: "Employee information has been updated successfully.",
            });
        } catch (error) {
            console.error('Error updating employee:', error);
            toast({
                title: "Error",
                description: "Failed to update employee information. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleStatusChange = async (newStatus) => {
        if (!employee)
            return;
        try {
            const response = await fetch(`/api/employees/${employeeId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update employee status');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update employee status');
            }

            setEmployee(prev => ({ ...prev, status: newStatus }));
            setIsDeactivateDialogOpen(false);
            toast({
                title: "Success",
                description: `Employee status has been changed to ${newStatus}.`,
            });
        } catch (error) {
            console.error('Error updating employee status:', error);
            toast({
                title: "Error",
                description: "Failed to update employee status. Please try again.",
                variant: "destructive"
            });
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
            case 'ON_LEAVE':
                return <Badge className="bg-yellow-100 text-yellow-800">On Leave</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };
    if (loading || isLoading) {
        return (<div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    if (!employee) {
        return (<div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2"/>
            Back
          </Button>
          <h1 className="text-2xl font-bold">Employee Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
              <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The employee you are looking for does not exist or has been removed.
              </p>
              <Button onClick={() => router.push('/admin/dashboard/employees')}>
                Return to Employees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>);
    }
    return (<div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2"/>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-2">{employee.role}</Badge>
              {getStatusBadge(employee.status)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <UserCog className="h-4 w-4 mr-2"/>
            Edit Employee
          </Button>
          {employee.status === 'ACTIVE' ? (<Button variant="destructive" onClick={() => setIsDeactivateDialogOpen(true)}>
              Deactivate Account
            </Button>) : (<Button variant="default" onClick={() => handleStatusChange('ACTIVE')}>
              Activate Account
            </Button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>Personal and employment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{employee.email}</p>
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{employee.phone}</p>
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{employee.address}</p>
                      <p className="text-xs text-muted-foreground">Address</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-2">Emergency Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <UserCog className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{(_a = employee.emergencyContact) === null || _a === void 0 ? void 0 : _a.name}</p>
                      <p className="text-xs text-muted-foreground">{(_b = employee.emergencyContact) === null || _b === void 0 ? void 0 : _b.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{(_c = employee.emergencyContact) === null || _c === void 0 ? void 0 : _c.phone}</p>
                      <p className="text-xs text-muted-foreground">Emergency Phone</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Employment Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{format(new Date(employee.hireDate), 'MMMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">Hire Date</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Star className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{employee.rating.toFixed(1)} / 5.0</p>
                      <p className="text-xs text-muted-foreground">Average Rating</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground"/>
                    <div>
                      <p className="text-sm">{employee.completedServices}</p>
                      <p className="text-xs text-muted-foreground">Completed Services</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-2">Service Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {employee.serviceAreas.map((area, index) => (<Badge key={index} variant="secondary">{area}</Badge>))}
                </div>

                <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(_d = employee.skills) === null || _d === void 0 ? void 0 : _d.map((skill, index) => (<Badge key={index} variant="outline">{skill}</Badge>))}
                </div>
              </div>
            </div>

            {employee.bio && (<>
                <Separator className="my-6"/>
                <div>
                  <h3 className="text-sm font-medium mb-2">Bio</h3>
                  <p className="text-sm text-muted-foreground">{employee.bio}</p>
                </div>
              </>)}

            <Separator className="my-6"/>
            <div>
              <h3 className="text-sm font-medium mb-2">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="text-sm font-medium">{(_e = employee.paymentInfo) === null || _e === void 0 ? void 0 : _e.accountNumber}</p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Routing Number</p>
                  <p className="text-sm font-medium">{(_f = employee.paymentInfo) === null || _f === void 0 ? void 0 : _f.routingNumber}</p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium">{(_g = employee.paymentInfo) === null || _g === void 0 ? void 0 : _g.paymentMethod}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Services */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
            <CardDescription>Scheduled services for this employee</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.upcomingServices && employee.upcomingServices.length > 0 ? (<div className="space-y-4">
                {employee.upcomingServices.map(service => (<div key={service.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{service.type}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(service.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{service.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(service.date), 'h:mm a')}
                    </p>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/admin/dashboard/services/${service.id}`)}>
                        <ClipboardList className="h-3 w-3 mr-1"/>
                        View Details
                      </Button>
                    </div>
                  </div>))}
              </div>) : (<div className="text-center py-6">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
                <p className="text-sm text-muted-foreground">No upcoming services scheduled</p>
              </div>)}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/admin/dashboard/services/schedule')}>
              Schedule New Service
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={editFormData.name} onChange={(e) => setEditFormData(Object.assign(Object.assign({}, editFormData), { name: e.target.value }))}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={editFormData.email} onChange={(e) => setEditFormData(Object.assign(Object.assign({}, editFormData), { email: e.target.value }))}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={editFormData.phone} onChange={(e) => setEditFormData(Object.assign(Object.assign({}, editFormData), { phone: e.target.value }))}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData(Object.assign(Object.assign({}, editFormData), { role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                  <SelectItem value="Senior Cleaner">Senior Cleaner</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-areas">Service Areas</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                {['Downtown', 'North Side', 'South Side', 'East Side', 'West Hills', 'Marina', 'Heights', 'Central', 'Industrial District', 'College Area'].map((area) => (<Badge key={area} variant={editFormData.serviceAreas.includes(area) ? "default" : "outline"} className="cursor-pointer" onClick={() => {
                if (editFormData.serviceAreas.includes(area)) {
                    setEditFormData(Object.assign(Object.assign({}, editFormData), { serviceAreas: editFormData.serviceAreas.filter(a => a !== area) }));
                }
                else {
                    setEditFormData(Object.assign(Object.assign({}, editFormData), { serviceAreas: [...editFormData.serviceAreas, area] }));
                }
            }}>
                    {area}
                  </Badge>))}
              </div>
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

      {/* Deactivate Employee Dialog */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this employee? They will no longer be able to access the system or be assigned to services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleStatusChange('INACTIVE')}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
