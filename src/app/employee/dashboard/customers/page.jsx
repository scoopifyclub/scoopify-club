'use client';
import { useState, useEffect } from 'react';
import { Search, User, MapPin, Phone, Mail, Star, Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function CustomersPage() {
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'EMPLOYEE',
        redirectTo: '/auth/login?callbackUrl=/employee/dashboard/customers'
    });

    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/employee/customers');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch customers');
                }

                const data = await response.json();
                setCustomers(data);
            } catch (error) {
                console.error('Error fetching customers:', error);
                toast.error('Failed to load customers');
                
                // Fallback to mock data in development
                if (process.env.NODE_ENV === 'development') {
                    const mockCustomers = [
                        {
                            id: '1',
                            name: 'John Smith',
                            email: 'john.smith@example.com',
                            phone: '(555) 123-4567',
                            address: '123 Main St, Anytown, USA',
                            serviceType: 'Weekly Cleanup',
                            rating: 4.8,
                            status: 'active',
                            lastService: '2024-03-10',
                            nextService: '2024-03-17'
                        },
                        {
                            id: '2',
                            name: 'Jane Doe',
                            email: 'jane.doe@example.com',
                            phone: '(555) 234-5678',
                            address: '456 Oak Ave, Anytown, USA',
                            serviceType: 'Bi-Weekly Cleanup',
                            rating: 4.9,
                            status: 'active',
                            lastService: '2024-03-05',
                            nextService: '2024-03-19'
                        },
                        {
                            id: '3',
                            name: 'Bob Wilson',
                            email: 'bob.wilson@example.com',
                            phone: '(555) 345-6789',
                            address: '789 Pine Rd, Anytown, USA',
                            serviceType: 'Monthly Cleanup',
                            rating: 4.7,
                            status: 'inactive',
                            lastService: '2024-02-15',
                            nextService: '2024-03-15'
                        }
                    ];
                    setCustomers(mockCustomers);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'EMPLOYEE') {
            fetchCustomers();
        }
    }, [user]);

    const filteredCustomers = customers
        .filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.address.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const aValue = sortBy === 'name' ? a.name : a.lastService;
            const bValue = sortBy === 'name' ? b.name : b.lastService;
            return sortOrder === 'asc' ? 
                aValue.localeCompare(bValue) : 
                bValue.localeCompare(aValue);
        });

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Customers</h1>
                <p className="text-gray-500">
                    {filteredCustomers.length} customers in your service area
                </p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"/>
                    <Input 
                        placeholder="Search customers..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="h-4 w-4 mr-2"/>
                            <SelectValue placeholder="Filter by status"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Customers</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="outline" 
                        onClick={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
                    >
                        <ArrowUpDown className="h-4 w-4 mr-2"/>
                        {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </Button>
                </div>
            </div>

            {/* Customers List */}
            <div className="space-y-4">
                {filteredCustomers.map(customer => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">{customer.name}</h3>
                                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                            {customer.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4"/>
                                            {customer.email}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4"/>
                                            {customer.phone}
                                        </div>
                                        <div className="flex items-center gap-2 sm:col-span-2">
                                            <MapPin className="h-4 w-4"/>
                                            {customer.address}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:w-auto">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current"/>
                                        <span className="font-medium">{customer.rating}</span>
                                    </div>
                                    <Badge variant="outline">{customer.serviceType}</Badge>
                                    <div className="text-sm">
                                        <div className="text-gray-500">Last Service: {customer.lastService}</div>
                                        <div className="text-gray-500">Next Service: {customer.nextService}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredCustomers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                        <p className="text-gray-500">
                            Try adjusting your search or filter to find what you're looking for.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
