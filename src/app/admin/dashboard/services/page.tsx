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
  CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, User
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';

interface Service {
  id: string;
  type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  customer: {
    id: string;
    name: string;
    address: string;
  };
  employee: {
    id: string;
    name: string;
  } | null;
  duration: number;
  price: number;
  notes: string;
}

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
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

    // Fetch services data
    fetchServices();
  }, [status, session, router]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch this data from your API
      // For now, using mock data
      const mockServices: Service[] = [
        {
          id: '1',
          type: 'Regular Cleaning',
          status: 'scheduled',
          scheduledDate: '2023-11-24T09:00:00Z',
          customer: {
            id: '101',
            name: 'John Smith',
            address: '123 Main St, Anytown, CA 94568'
          },
          employee: {
            id: '201',
            name: 'David Miller'
          },
          duration: 120,
          price: 85.00,
          notes: 'Customer requested extra attention to kitchen area'
        },
        {
          id: '2',
          type: 'Deep Cleaning',
          status: 'in_progress',
          scheduledDate: '2023-11-23T10:30:00Z',
          customer: {
            id: '102',
            name: 'Jane Doe',
            address: '456 Oak Ave, Someville, CA 94582'
          },
          employee: {
            id: '202',
            name: 'Sarah Johnson'
          },
          duration: 180,
          price: 120.00,
          notes: 'First time deep cleaning, bring extra supplies'
        },
        {
          id: '3',
          type: 'Move-out Cleaning',
          status: 'completed',
          scheduledDate: '2023-11-22T13:00:00Z',
          customer: {
            id: '103',
            name: 'Robert Johnson',
            address: '789 Pine Rd, Othertown, CA 94521'
          },
          employee: {
            id: '203',
            name: 'Tom Wilson'
          },
          duration: 240,
          price: 200.00,
          notes: 'Final cleaning before move-out inspection'
        },
        {
          id: '4',
          type: 'Regular Cleaning',
          status: 'cancelled',
          scheduledDate: '2023-11-22T15:30:00Z',
          customer: {
            id: '104',
            name: 'Emily Wilson',
            address: '321 Cedar Ln, Newcity, CA 94537'
          },
          employee: null,
          duration: 90,
          price: 65.00,
          notes: 'Cancelled by customer due to personal emergency'
        },
        {
          id: '5',
          type: 'Deep Cleaning',
          status: 'scheduled',
          scheduledDate: '2023-11-25T11:00:00Z',
          customer: {
            id: '105',
            name: 'Michael Brown',
            address: '654 Maple Dr, Lastville, CA 94598'
          },
          employee: {
            id: '204',
            name: 'Emily Davis'
          },
          duration: 180,
          price: 120.00,
          notes: 'Customer has pets, bring appropriate cleaning supplies'
        }
      ];
      
      setServices(mockServices);
      setFilteredServices(mockServices);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters when they change
    filterServices();
  }, [searchQuery, statusFilter, dateFilter, services]);

  const filterServices = () => {
    let filtered = [...services];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => service.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(service => 
        isSameDay(parseISO(service.scheduledDate), parseISO(dateFilter))
      );
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.customer.name.toLowerCase().includes(query) || 
        service.type.toLowerCase().includes(query) ||
        (service.employee?.name.toLowerCase().includes(query) || false)
      );
    }
    
    setFilteredServices(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleViewService = (serviceId: string) => {
    router.push(`/admin/dashboard/services/${serviceId}`);
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
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage service schedules and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/dashboard/services/schedule')} className="whitespace-nowrap">
            <PlusIcon className="h-4 w-4 mr-2" />
            Schedule Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Management</CardTitle>
          <CardDescription>View and manage cleaning services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search services..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              className="w-full md:w-48 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <div className="w-full md:w-48">
              <Input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Button
              variant="outline"
              className="ml-auto"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Schedule</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Employee</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredServices.map((service) => (
                    <tr 
                      key={service.id} 
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                      onClick={() => handleViewService(service.id)}
                    >
                      <td className="p-4 align-middle">
                        <div className="font-medium">{service.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(service.duration / 60)}h {service.duration % 60}m
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{service.customer.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[180px]">{service.customer.address}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle hidden md:table-cell">
                        <div>{format(parseISO(service.scheduledDate), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(service.scheduledDate), 'h:mm a')}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge className={getStatusColor(service.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(service.status)}
                            <span className="ml-1">{formatStatus(service.status)}</span>
                          </div>
                        </Badge>
                      </td>
                      <td className="p-4 align-middle hidden md:table-cell">
                        {service.employee ? (
                          <div className="flex items-center">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <User className="h-4 w-4" />
                            </div>
                            <span>{service.employee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
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

                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No services found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing <strong>{filteredServices.length}</strong> of <strong>{services.length}</strong> services
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchServices}
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