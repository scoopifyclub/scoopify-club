'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Clock, MapPin, User, Calendar, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface Service {
  id: string;
  type: 'Weekly Cleanup' | 'Bi-Weekly Cleanup' | 'One-Time Cleanup';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  customerName: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
}

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Weekly Cleanup' | 'Bi-Weekly Cleanup' | 'One-Time Cleanup'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/employee/dashboard');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    // Fetch services data
    const fetchServices = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, using mock data
        const mockServices: Service[] = [
          {
            id: '1',
            type: 'Weekly Cleanup',
            status: 'scheduled',
            customerName: 'John Smith',
            address: '123 Main St, Anytown, USA',
            date: '2024-03-15',
            startTime: '09:00',
            endTime: '10:30',
            notes: 'Front yard needs extra attention',
            priority: 'high'
          },
          {
            id: '2',
            type: 'Bi-Weekly Cleanup',
            status: 'in-progress',
            customerName: 'Jane Doe',
            address: '456 Oak Ave, Anytown, USA',
            date: '2024-03-15',
            startTime: '11:00',
            endTime: '12:30',
            notes: 'Customer requested eco-friendly products',
            priority: 'medium'
          },
          {
            id: '3',
            type: 'One-Time Cleanup',
            status: 'completed',
            customerName: 'Bob Wilson',
            address: '789 Pine Rd, Anytown, USA',
            date: '2024-03-14',
            startTime: '14:00',
            endTime: '16:00',
            notes: 'Large yard, may need extra time',
            priority: 'low'
          }
        ];
        setServices(mockServices);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching services:', error);
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchServices();
    }
  }, [status, session, router]);

  const getStatusColor = (status: Service['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Service['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredServices = services
    .filter(service => {
      const matchesSearch = service.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      const matchesType = typeFilter === 'all' || service.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const aDate = new Date(`${a.date} ${a.startTime}`).getTime();
        const bDate = new Date(`${b.date} ${b.startTime}`).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      } else {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        return sortOrder === 'asc' ? aPriority - bPriority : bPriority - aPriority;
      }
    });

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yard Cleanups</h1>
        <p className="text-gray-500">
          Manage your scheduled yard cleanup services
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-[160px]">
              <CheckSquare className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Weekly Cleanup">Weekly</SelectItem>
              <SelectItem value="Bi-Weekly Cleanup">Bi-Weekly</SelectItem>
              <SelectItem value="One-Time Cleanup">One-Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
            }}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </Button>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map(service => (
          <Card key={service.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(service.priority)}>
                      {service.priority} priority
                    </Badge>
                    <Badge variant="outline">{service.type}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {service.customerName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(service.date), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {service.startTime} - {service.endTime}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {service.address}
                    </div>
                  </div>
                  {service.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Notes:</span> {service.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {service.status === 'scheduled' && (
                    <Button variant="default" size="sm">
                      Start Service
                    </Button>
                  )}
                  {service.status === 'in-progress' && (
                    <Button variant="default" size="sm">
                      Complete Service
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No services found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 