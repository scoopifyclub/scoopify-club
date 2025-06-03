"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Phone, Mail, Calendar, Star, MessageCircle, Search } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulate loading customers data
        setTimeout(() => {
            setCustomers([
                {
                    id: 1,
                    name: 'John Smith',
                    email: 'john.smith@email.com',
                    phone: '(555) 123-4567',
                    address: '123 Main St, Denver, CO 80831',
                    serviceType: 'Weekly Cleanup',
                    status: 'active',
                    lastService: '2024-01-15',
                    nextService: '2024-01-22',
                    totalServices: 12,
                    rating: 5,
                    notes: 'Friendly customer, gate code: 1234',
                    joinDate: '2023-10-01',
                    preferences: 'Prefers morning appointments'
                },
                {
                    id: 2,
                    name: 'Sarah Johnson',
                    email: 'sarah.j@email.com',
                    phone: '(555) 234-5678',
                    address: '456 Oak Ave, Denver, CO 80831',
                    serviceType: 'Bi-weekly Cleanup',
                    status: 'active',
                    lastService: '2024-01-10',
                    nextService: '2024-01-24',
                    totalServices: 8,
                    rating: 4,
                    notes: 'Dog is friendly but may bark initially',
                    joinDate: '2023-11-15',
                    preferences: 'Afternoon appointments preferred'
                },
                {
                    id: 3,
                    name: 'Mike Wilson',
                    email: 'mike.wilson@email.com',
                    phone: '(555) 345-6789',
                    address: '789 Pine Rd, Denver, CO 80831',
                    serviceType: 'Monthly Cleanup',
                    status: 'inactive',
                    lastService: '2023-12-20',
                    nextService: null,
                    totalServices: 6,
                    rating: 5,
                    notes: 'Key under mat, please lock door when finished',
                    joinDate: '2023-09-01',
                    preferences: 'No specific time preference'
                },
                {
                    id: 4,
                    name: 'Lisa Brown',
                    email: 'lisa.brown@email.com',
                    phone: '(555) 456-7890',
                    address: '321 Elm St, Denver, CO 80831',
                    serviceType: 'Weekly Cleanup',
                    status: 'active',
                    lastService: '2024-01-14',
                    nextService: '2024-01-21',
                    totalServices: 15,
                    rating: 5,
                    notes: 'Great customer, always satisfied with service',
                    joinDate: '2023-08-15',
                    preferences: 'Morning appointments only'
                }
            ]);
            setLoading(false);
        }, 1000);
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
                className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
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
                                <p className="text-2xl font-bold">{customers.length}</p>
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
                                <p className="text-2xl font-bold">{activeCustomers.length}</p>
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
                                <p className="text-2xl font-bold">
                                    {(customers.reduce((sum, c) => sum + c.rating, 0) / customers.length).toFixed(1)}
                                </p>
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
                                <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.totalServices, 0)}</p>
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
                                            <User className="h-5 w-5 text-gray-500" />
                                            <h3 className="text-lg font-semibold">{customer.name}</h3>
                                            {getStatusBadge(customer.status)}
                                            <div className="flex items-center gap-1">
                                                {getRatingStars(customer.rating)}
                                                <span className="text-sm text-gray-500 ml-1">({customer.rating}/5)</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span>Customer since: {new Date(customer.joinDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p className="text-sm"><strong>Service:</strong> {customer.serviceType}</p>
                                                <p className="text-sm"><strong>Total Services:</strong> {customer.totalServices}</p>
                                                <p className="text-sm"><strong>Last Service:</strong> {new Date(customer.lastService).toLocaleDateString()}</p>
                                                {customer.nextService && (
                                                    <p className="text-sm"><strong>Next Service:</strong> {new Date(customer.nextService).toLocaleDateString()}</p>
                                                )}
                                                <p className="text-sm"><strong>Preferences:</strong> {customer.preferences}</p>
                                            </div>
                                        </div>
                                        
                                        {customer.notes && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                                <p className="text-sm text-gray-600">{customer.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-6">
                                        <Button size="sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Schedule Service
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Phone className="h-4 w-4 mr-2" />
                                            Call
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
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Customers Found</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any active customers yet.'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="inactive" className="space-y-4">
                    {inactiveCustomers.map((customer) => (
                        <Card key={customer.id} className="opacity-75">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <User className="h-5 w-5 text-gray-500" />
                                            <h3 className="text-lg font-semibold">{customer.name}</h3>
                                            {getStatusBadge(customer.status)}
                                            <div className="flex items-center gap-1">
                                                {getRatingStars(customer.rating)}
                                                <span className="text-sm text-gray-500 ml-1">({customer.rating}/5)</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p className="text-sm"><strong>Service:</strong> {customer.serviceType}</p>
                                                <p className="text-sm"><strong>Total Services:</strong> {customer.totalServices}</p>
                                                <p className="text-sm"><strong>Last Service:</strong> {new Date(customer.lastService).toLocaleDateString()}</p>
                                                <p className="text-sm text-red-600"><strong>Status:</strong> Inactive since {new Date(customer.lastService).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-6">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                            Reactivate
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Contact
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
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Inactive Customers Found</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'All your customers are active!'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
