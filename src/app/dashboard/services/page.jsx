'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, PhoneIcon, CalendarDays, Eye } from 'lucide-react';
import { CustomerDashboardLayout } from '@/components/layouts/CustomerDashboardLayout';
import RescheduleModal from '@/components/RescheduleModal';
import ServiceTrackingCard from '@/components/ServiceTrackingCard';

export default function ServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, service: null });
    const [selectedService, setSelectedService] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'tracking'

    useEffect(() => {
        fetchServices();
    }, []);

    // Poll for service updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (viewMode === 'tracking') {
                fetchServices();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [viewMode]);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/customer/services', {
                credentials: 'include'
            });
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error('Failed to fetch services');
            }
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
                setServices(data.data);
            } else if (Array.isArray(data)) {
                setServices(data);
            } else {
                console.error('Expected array of services but got:', data);
                setServices([]);
                setError('Invalid data format received from server');
            }
        }
        catch (err) {
            setError('Failed to load services');
            console.error('Error fetching services:', err);
        }
        finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS':
                return 'bg-orange-100 text-orange-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleCancelService = async (serviceId) => {
        if (!confirm('Are you sure you want to cancel this service?')) {
            return;
        }
        try {
            const cookies = document.cookie.split(';');
            const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
            const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1].trim() : '';
            if (!accessToken) {
                toast.error('You need to be logged in to cancel a service');
                router.push('/login');
                return;
            }
            const response = await fetch(`/api/customer/services/${serviceId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to cancel service');
            }
            toast.success('Service cancelled successfully');
            fetchServices();
        }
        catch (err) {
            toast.error('Failed to cancel service');
            console.error('Error cancelling service:', err);
        }
    };

    const openRescheduleModal = (service) => {
        setRescheduleModal({ isOpen: true, service });
    };

    const closeRescheduleModal = () => {
        setRescheduleModal({ isOpen: false, service: null });
    };

    const handleServiceRescheduled = (updatedService) => {
        // Update the service in the local state
        setServices(prevServices => 
            prevServices.map(service => 
                service.id === updatedService.id ? updatedService : service
            )
        );
    };

    const handleViewService = (service) => {
        setSelectedService(service);
        setViewMode('tracking');
    };

    const handleBackToTable = () => {
        setSelectedService(null);
        setViewMode('table');
    };

    if (loading) {
        return (
            <CustomerDashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </CustomerDashboardLayout>
        );
    }

    // If viewing a specific service in tracking mode
    if (viewMode === 'tracking' && selectedService) {
        return (
            <CustomerDashboardLayout>
                <div className="max-w-4xl mx-auto p-6">
                    <div className="flex items-center justify-between mb-6">
                        <Button 
                            variant="outline" 
                            onClick={handleBackToTable}
                            className="flex items-center gap-2"
                        >
                            ← Back to Services
                        </Button>
                        <h1 className="text-2xl font-bold">Service Tracking</h1>
                    </div>
                    
                    <ServiceTrackingCard 
                        service={selectedService} 
                        onUpdate={handleServiceRescheduled}
                    />
                </div>
            </CustomerDashboardLayout>
        );
    }
    
    return (
        <CustomerDashboardLayout>
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Services</h1>
                    <div className="flex gap-3">
                        <Button 
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            onClick={() => setViewMode('table')}
                        >
                            Table View
                        </Button>
                        <Button 
                            variant={viewMode === 'tracking' ? 'default' : 'outline'}
                            onClick={() => setViewMode('tracking')}
                        >
                            Tracking View
                        </Button>
                        <Button onClick={() => router.push('/dashboard/schedule')}>
                            Schedule New Service
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming</CardTitle>
                            <CardDescription>Scheduled services</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {Array.isArray(services) ? services.filter((s) => s.status === 'SCHEDULED').length : 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>In Progress</CardTitle>
                            <CardDescription>Currently being serviced</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {Array.isArray(services) ? services.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'PENDING').length : 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Completed</CardTitle>
                            <CardDescription>Past services</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {Array.isArray(services) ? services.filter((s) => s.status === 'COMPLETED').length : 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tracking View */}
                {viewMode === 'tracking' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service) => (
                            <ServiceTrackingCard 
                                key={service.id} 
                                service={service} 
                                onUpdate={handleServiceRescheduled}
                            />
                        ))}
                    </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Service History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Service Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Scooper</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!Array.isArray(services) || services.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                No services found. Schedule your first service now!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        services.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <CalendarIcon className="w-4 h-4 mr-1"/>
                                                            {format(new Date(service.scheduledDate), 'MMM d, yyyy')}
                                                        </div>
                                                        <div className="flex items-center text-gray-500">
                                                            <ClockIcon className="w-4 h-4 mr-1"/>
                                                            {format(new Date(service.scheduledDate), 'h:mm a')}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {service.servicePlan?.name || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(service.status)}>
                                                        {service.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <UserIcon className="w-4 h-4 mr-1"/>
                                                            {service.employee?.user?.name || 'Unassigned'}
                                                        </div>
                                                        <div className="flex items-center text-gray-500">
                                                            <PhoneIcon className="w-4 h-4 mr-1"/>
                                                            {service.employee?.phone || 'N/A'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <MapPinIcon className="w-4 h-4 mr-1"/>
                                                        {service.location?.address || 'Address not available'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleViewService(service)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            Track
                                                        </Button>
                                                        {service.status === 'SCHEDULED' && (
                                                            <>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={() => openRescheduleModal(service)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <CalendarDays className="w-3 h-3" />
                                                                    Reschedule
                                                                </Button>
                                                                <Button 
                                                                    variant="destructive" 
                                                                    size="sm" 
                                                                    onClick={() => handleCancelService(service.id)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Reschedule Modal */}
                <RescheduleModal
                    isOpen={rescheduleModal.isOpen}
                    onClose={closeRescheduleModal}
                    service={rescheduleModal.service}
                    onReschedule={handleServiceRescheduled}
                />
            </div>
        </CustomerDashboardLayout>
    );
}
