'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, SearchIcon, RefreshCcw, MoreHorizontalIcon, UserIcon, MailIcon, PhoneIcon, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function CustomersPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/customers', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }

            const data = await response.json();
            setCustomers(data);
            toast.success('Customer list updated');
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to fetch customers');
            setError('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCustomers();
        }
    }, [status]);

    useEffect(() => {
        // Filter customers when search query changes
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            const filtered = customers.filter(customer => 
                customer.name.toLowerCase().includes(query) ||
                customer.email.toLowerCase().includes(query) ||
                customer.phone.includes(query)
            );
            setCustomers(filtered);
        } else {
            setCustomers(customers); // Keep original customers if search term is empty
        }
    }, [searchTerm, customers]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewCustomer = (customerId) => {
        router.push(`/admin/dashboard/customers/${customerId}`);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage your customer accounts and service history
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => router.push('/admin/dashboard/customers/add')} 
                        className="whitespace-nowrap"
                    >
                        <PlusIcon className="h-4 w-4 mr-2"/>
                        Add Customer
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <CardTitle>Customer List</CardTitle>
                        <div className="relative w-full md:w-64">
                            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input 
                                placeholder="Search customers..." 
                                className="pl-8" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Join Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Spent</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {customers.map((customer) => (
                                        <tr 
                                            key={customer.id} 
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer" 
                                            onClick={() => handleViewCustomer(customer.id)}
                                        >
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-muted h-8 w-8 flex items-center justify-center">
                                                        <UserIcon className="h-4 w-4"/>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{customer.name}</div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{customer.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center">
                                                        <MailIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                        <span className="text-xs">{customer.email}</span>
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <PhoneIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                        <span className="text-xs">{customer.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle hidden md:table-cell">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="h-3 w-3 mr-2 text-muted-foreground"/>
                                                    {format(new Date(customer.joinDate), 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge className={getStatusColor(customer.status)}>
                                                    {customer.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle">
                                                ${customer.totalSpent.toLocaleString()}
                                                <div className="text-xs text-muted-foreground">
                                                    {customer.servicesCount} services
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Additional actions menu could be added here
                                                    }}
                                                >
                                                    <MoreHorizontalIcon className="h-4 w-4"/>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {customers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                No customers found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing <strong>{customers.length}</strong> of <strong>{customers.length}</strong> customers
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchCustomers}
                            disabled={loading}
                        >
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
