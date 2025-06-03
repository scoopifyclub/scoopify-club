"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Phone, Mail, Calendar, Star, MessageCircle, Search, AlertCircle } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCustomersData = async () => {
            try {
                // Get all services to extract customer data
                const servicesResponse = await fetch('/api/employee/services', {
                    credentials: 'include',
                });
                
                // Get completed services for customer history
                const historyResponse = await fetch('/api/employee/services/history', {
                    credentials: 'include',
                });
                
                // Get dashboard stats
                const dashboardResponse = await fetch('/api/employee/dashboard', {
                    credentials: 'include',
                });

                if (servicesResponse.ok && historyResponse.ok && dashboardResponse.ok) {
                    const servicesData = await servicesResponse.json();
                    const historyData = await historyResponse.json();
                    const dashboardData = await dashboardResponse.json();
                    
                    // Extract unique customers from services data
                    const customerMap = new Map();
                    
                    // Process active services
                    (servicesData || []).forEach(service => {
                        const customer = service.customer;
                        if (customer && customer.id) {
                            const customerId = customer.id;
                            
                            if (!customerMap.has(customerId)) {
                                customerMap.set(customerId, {
                                    id: customerId,
                                    name: customer.user?.name || customer.name || 'Unknown Customer',
                                    email: customer.user?.email || customer.email || 'No email',
                                    phone: customer.phone || customer.user?.phone || 'No phone',
                                    address: customer.address ? 
                                        `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.state || ''} ${customer.address.zipCode || ''}`.trim().replace(/^,\s*/, '') :
                                        'Address not available',
                                    serviceType: service.serviceType || service.type || 'Pet Waste Cleanup',
                                    status: 'active',
                                    lastService: null,
                                    nextService: service.scheduledDate || service.scheduledFor,
                                    totalServices: 0,
                                    rating: 0,
                                    notes: service.specialInstructions || service.notes || 'No notes available',
                                    joinDate: customer.createdAt || customer.user?.createdAt,
                                    preferences: 'No specific preferences'
                                });
                            }
                            
                            // Update next service if this one is sooner
                            const existing = customerMap.get(customerId);
                            const serviceDate = new Date(service.scheduledDate || service.scheduledFor);
                            const existingNext = existing.nextService ? new Date(existing.nextService) : null;
                            
                            if (!existingNext || serviceDate < existingNext) {
                                existing.nextService = service.scheduledDate || service.scheduledFor;
                            }
                        }
                    });
                    
                    // Process completed services for additional customer data and stats
                    (historyData || []).forEach(service => {
                        const customer = service.customer;
                        if (customer && customer.id) {
                            const customerId = customer.id;
                            
                            if (!customerMap.has(customerId)) {
                                customerMap.set(customerId, {
                                    id: customerId,
                                    name: customer.user?.name || customer.name || 'Unknown Customer',
                                    email: customer.user?.email || customer.email || 'No email',
                                    phone: customer.phone || customer.user?.phone || 'No phone',
                                    address: customer.address ? 
                                        `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.state || ''} ${customer.address.zipCode || ''}`.trim().replace(/^,\s*/, '') :
                                        'Address not available',
                                    serviceType: service.serviceType || service.type || 'Pet Waste Cleanup',
                                    status: 'inactive', // Will be updated if they have active services
                                    lastService: service.completedAt || service.updatedAt,
                                    nextService: null,
                                    totalServices: 1,
                                    rating: service.rating || 0,
                                    notes: service.notes || 'No notes available',
                                    joinDate: customer.createdAt || customer.user?.createdAt,
                                    preferences: 'No specific preferences'
                                });
                            } else {
                                // Update existing customer with completed service data
                                const existing = customerMap.get(customerId);
                                existing.totalServices += 1;
                                
                                // Update last service if this one is more recent
                                const serviceDate = new Date(service.completedAt || service.updatedAt);
                                const existingLast = existing.lastService ? new Date(existing.lastService) : null;
                                
                                if (!existingLast || serviceDate > existingLast) {
                                    existing.lastService = service.completedAt || service.updatedAt;
                                }
                                
                                // Update rating (average of ratings)
                                if (service.rating) {
                                    existing.rating = existing.rating ? (existing.rating + service.rating) / 2 : service.rating;
                                }
                            }
                        }
                    });
                    
                    // Convert to array and format dates
                    const formattedCustomers = Array.from(customerMap.values()).map(customer => ({
                        ...customer,
                        lastService: customer.lastService ? new Date(customer.lastService).toLocaleDateString() : null,
                        nextService: customer.nextService ? new Date(customer.nextService).toLocaleDateString() : null,
                        joinDate: customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'Unknown',
                        rating: Math.round(customer.rating * 10) / 10 // Round to 1 decimal
                    }));
                    
                    setCustomers(formattedCustomers);
                    
                    // Calculate stats
                    const activeCustomers = formattedCustomers.filter(c => c.status === 'active');
                    const totalRating = formattedCustomers.reduce((sum, c) => sum + (c.rating || 0), 0);
                    const avgRating = formattedCustomers.length > 0 ? totalRating / formattedCustomers.length : 0;
                    const totalServices = formattedCustomers.reduce((sum, c) => sum + c.totalServices, 0);
                    
                    setStats({
                        totalCustomers: formattedCustomers.length,
                        activeCustomers: activeCustomers.length,
                        avgRating: Math.round(avgRating * 10) / 10,
                        totalServices: totalServices
                    });
                } else {
                    console.error('Failed to fetch customers data');
                    setError('Failed to load customers data');
                    setCustomers([]);
                    setStats({
                        totalCustomers: 0,
                        activeCustomers: 0,
                        avgRating: 0,
                        totalServices: 0
                    });
                }
            } catch (error) {
                console.error('Error fetching customers data:', error);
                setError('Failed to load customers data');
                setCustomers([]);
                setStats({
                    totalCustomers: 0,
                    activeCustomers: 0,
                    avgRating: 0,
                    totalServices: 0
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchCustomersData();
    }, []);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCustomers = filteredCustomers.filter(c => c.status === 'active');
    const inactiveCustomers = filteredCustomers.filter(c => c.status === 'inactive');

    const getStatusBadge = (status) => {
        return status === 'active' 
            ? <Badge className="bg-green-100 text-green-800">Active</Badge>
            : <Badge variant="secondary">Inactive</Badge>;
    };

    const getRatingStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
            />
        ));
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Customers</h1>
                    <p className="text-gray-600">Manage your customer relationships and service history</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">⚠️ {error}</p>
                            <Button onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Customers</h1>
                <p className="text-gray-600">Manage your customer relationships and service history</p>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <User className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold">{stats.totalCustomers || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <User className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                                <p className="text-2xl font-bold">{stats.activeCustomers || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Star className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                                <p className="text-2xl font-bold">{stats.avgRating || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Services</p>
                                <p className="text-2xl font-bold">{stats.totalServices || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search customers by name, address, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Customer Tabs */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Customers ({activeCustomers.length})</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive Customers ({inactiveCustomers.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeCustomers.map((customer) => (
                        <Card key={customer.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <User className="h-5 w-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold">{customer.name}</h3>
                                            {getStatusBadge(customer.status)}
                                            <div className="flex items-center gap-1">
                                                {getRatingStars(customer.rating)}
                                                <span className="text-sm text-gray-500 ml-1">({customer.rating})</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{customer.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm"><strong>Service Type:</strong> {customer.serviceType}</p>
                                                <p className="text-sm"><strong>Total Services:</strong> {customer.totalServices}</p>
                                                <p className="text-sm"><strong>Next Service:</strong> {customer.nextService || 'Not scheduled'}</p>
                                                <p className="text-sm"><strong>Customer Since:</strong> {customer.joinDate}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                            <p className="text-sm text-gray-600">{customer.notes}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-4">
                                        <Button size="sm">
                                            <MessageCircle className="h-3 w-3 mr-1" />
                                            Message
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Phone className="h-3 w-3 mr-1" />
                                            Call
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Schedule
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            View History
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {activeCustomers.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Customers</h3>
                                <p className="text-gray-500">Active customers will appear here when you have scheduled services.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="inactive" className="space-y-4">
                    {inactiveCustomers.map((customer) => (
                        <Card key={customer.id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <User className="h-5 w-5 text-gray-500" />
                                            <h3 className="text-lg font-semibold">{customer.name}</h3>
                                            {getStatusBadge(customer.status)}
                                            <div className="flex items-center gap-1">
                                                {getRatingStars(customer.rating)}
                                                <span className="text-sm text-gray-500 ml-1">({customer.rating})</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{customer.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm"><strong>Last Service Type:</strong> {customer.serviceType}</p>
                                                <p className="text-sm"><strong>Total Services:</strong> {customer.totalServices}</p>
                                                <p className="text-sm"><strong>Last Service:</strong> {customer.lastService || 'Never'}</p>
                                                <p className="text-sm"><strong>Customer Since:</strong> {customer.joinDate}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                            <p className="text-sm text-gray-600">{customer.notes}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-4">
                                        <Button size="sm">
                                            <MessageCircle className="h-3 w-3 mr-1" />
                                            Message
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Phone className="h-3 w-3 mr-1" />
                                            Call
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Re-activate
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            View History
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {inactiveCustomers.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Inactive Customers</h3>
                                <p className="text-gray-500">Inactive customers will appear here.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
