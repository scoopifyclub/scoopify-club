"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    Calendar, 
    MapPin, 
    User, 
    Clock, 
    DollarSign,
    RefreshCw,
    Plus,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

export default function TestServicesPage() {
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [servicesRes, customersRes, employeesRes] = await Promise.all([
                fetch('/api/admin/services'),
                fetch('/api/admin/customers'),
                fetch('/api/admin/employees')
            ]);

            if (servicesRes.ok) {
                const servicesData = await servicesRes.json();
                setServices(servicesData);
            }

            if (customersRes.ok) {
                const customersData = await customersRes.json();
                setCustomers(customersData);
            }

            if (employeesRes.ok) {
                const employeesData = await employeesRes.json();
                setEmployees(employeesData);
            }

            // Calculate stats
            const scheduledServices = services.filter(s => s.status === 'SCHEDULED');
            const claimedServices = services.filter(s => s.status === 'ASSIGNED' || s.status === 'IN_PROGRESS');
            const completedServices = services.filter(s => s.status === 'COMPLETED');

            setStats({
                totalServices: services.length,
                scheduled: scheduledServices.length,
                claimed: claimedServices.length,
                completed: completedServices.length,
                totalCustomers: customers.length,
                totalEmployees: employees.length
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        }
    };

    const createTestServices = async (count = 5) => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/create-test-services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ count, hours: 2 }),
            });

            if (!response.ok) {
                throw new Error('Failed to create test services');
            }

            const data = await response.json();
            toast.success(`Created ${data.services.length} test services!`);
            
            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error creating test services:', error);
            toast.error('Failed to create test services');
        } finally {
            setLoading(false);
        }
    };

    const runWeeklyServicesCron = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/cron/create-weekly-services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
                },
            });

            if (!response.ok) {
                throw new Error('Failed to run weekly services cron');
            }

            const data = await response.json();
            toast.success(`Created ${data.servicesCreated} weekly services!`);
            
            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error running cron:', error);
            toast.error('Failed to run weekly services cron');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadge = (status) => {
        const colors = {
            'SCHEDULED': 'bg-blue-100 text-blue-800',
            'ASSIGNED': 'bg-yellow-100 text-yellow-800',
            'IN_PROGRESS': 'bg-purple-100 text-purple-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800'
        };
        
        return (
            <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Service Testing Dashboard</h1>
                <p className="text-gray-600">Test service creation and monitor the complete workflow</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Total Services</p>
                                <p className="text-xl font-bold">{stats.totalServices || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Scheduled</p>
                                <p className="text-xl font-bold">{stats.scheduled || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <User className="h-6 w-6 text-purple-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Claimed</p>
                                <p className="text-xl font-bold">{stats.claimed || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-xl font-bold">{stats.completed || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <User className="h-6 w-6 text-indigo-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Customers</p>
                                <p className="text-xl font-bold">{stats.totalCustomers || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <User className="h-6 w-6 text-orange-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Employees</p>
                                <p className="text-xl font-bold">{stats.totalEmployees || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Create Test Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Create test services for immediate employee claiming
                        </p>
                        <Button 
                            onClick={() => createTestServices(5)} 
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Creating...' : 'Create 5 Test Services'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Weekly Services Cron
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Run the weekly service creation job manually
                        </p>
                        <Button 
                            onClick={runWeeklyServicesCron} 
                            disabled={loading}
                            variant="outline"
                            className="w-full"
                        >
                            {loading ? 'Running...' : 'Run Weekly Cron'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Refresh Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Refresh all dashboard data
                        </p>
                        <Button 
                            onClick={fetchData} 
                            variant="outline"
                            className="w-full"
                        >
                            Refresh
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Services */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Services</CardTitle>
                </CardHeader>
                <CardContent>
                    {services.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No Services Found</h3>
                            <p className="text-gray-500">Create some test services to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {services.slice(0, 10).map((service) => (
                                <div key={service.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-medium">{service.serviceType || 'Pet Waste Cleanup'}</h3>
                                            <p className="text-sm text-gray-600">
                                                Customer: {service.customer?.user?.name || 'Unknown'}
                                            </p>
                                        </div>
                                        {getStatusBadge(service.status)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>{formatDate(service.scheduledDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span>{service.customer?.address?.zipCode || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span>{service.employee?.user?.name || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                    
                                    {service.specialInstructions && (
                                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                            {service.specialInstructions}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 