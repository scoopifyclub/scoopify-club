'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon, SearchIcon, RefreshCcw, MoreHorizontalIcon,
  UserIcon, MailIcon, PhoneIcon, MapPinIcon, CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';

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
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/dashboard');
      return;
    }
    
    // Verify user is an admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch customers data
    fetchCustomers();
  }, [status, session, router]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch this data from your API
      // For now, using mock data
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St, Anytown, CA 94568',
          status: 'active',
          joinDate: '2023-01-15',
          lastService: '2023-11-20',
          totalSpent: 750.50,
          servicesCount: 12
        },
        {
          id: '2',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '(555) 987-6543',
          address: '456 Oak Ave, Someville, CA 94582',
          status: 'active',
          joinDate: '2023-02-28',
          lastService: '2023-11-18',
          totalSpent: 1250.75,
          servicesCount: 18
        },
        {
          id: '3',
          name: 'Robert Johnson',
          email: 'robert.j@example.com',
          phone: '(555) 456-7890',
          address: '789 Pine Rd, Othertown, CA 94521',
          status: 'inactive',
          joinDate: '2023-03-10',
          lastService: '2023-09-05',
          totalSpent: 325.25,
          servicesCount: 5
        },
        {
          id: '4',
          name: 'Emily Wilson',
          email: 'emily.w@example.com',
          phone: '(555) 789-0123',
          address: '321 Cedar Ln, Newcity, CA 94537',
          status: 'pending',
          joinDate: '2023-10-22',
          lastService: '',
          totalSpent: 0,
          servicesCount: 0
        },
        {
          id: '5',
          name: 'Michael Brown',
          email: 'michael.b@example.com',
          phone: '(555) 234-5678',
          address: '654 Maple Dr, Lastville, CA 94598',
          status: 'active',
          joinDate: '2023-05-17',
          lastService: '2023-11-15',
          totalSpent: 975.00,
          servicesCount: 15
        }
      ];
      
      setCustomers(mockCustomers);
      setFilteredCustomers(mockCustomers);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter customers when search query changes
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) || 
        customer.email.toLowerCase().includes(query) || 
        customer.phone.includes(query)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const getStatusColor = (status: string) => {
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

  const handleViewCustomer = (customerId: string) => {
    router.push(`/admin/dashboard/customers/${customerId}`);
  };

  if (status === 'loading' || isLoading) {
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
          <Button onClick={() => router.push('/admin/dashboard/customers/add')} className="whitespace-nowrap">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <CardTitle>Customer List</CardTitle>
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                      onClick={() => handleViewCustomer(customer.id)}
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted h-8 w-8 flex items-center justify-center">
                            <UserIcon className="h-4 w-4" />
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
                            <MailIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                            <span className="text-xs">{customer.email}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <PhoneIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                            <span className="text-xs">{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle hidden md:table-cell">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-2 text-muted-foreground" />
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
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation();
                          // Additional actions menu could be added here
                        }}>
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredCustomers.length === 0 && (
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
              Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCustomers}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 