'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Appointment {
  id: string;
  date: Date;
  customerName: string;
  address: string;
  serviceType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/employee/dashboard');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    // Fetch appointments data
    const fetchAppointments = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, using mock data
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            date: new Date(),
            customerName: 'John Smith',
            address: '123 Main St, Anytown, USA',
            serviceType: 'Weekly Cleanup',
            status: 'scheduled',
            startTime: '09:00',
            endTime: '10:30'
          },
          {
            id: '2',
            date: new Date(),
            customerName: 'Jane Doe',
            address: '456 Oak Ave, Anytown, USA',
            serviceType: 'Bi-Weekly Cleanup',
            status: 'completed',
            startTime: '11:00',
            endTime: '12:30'
          },
          {
            id: '3',
            date: addWeeks(new Date(), 1),
            customerName: 'Bob Wilson',
            address: '789 Pine Rd, Anytown, USA',
            serviceType: 'One-Time Cleanup',
            status: 'scheduled',
            startTime: '14:00',
            endTime: '16:00'
          }
        ];
        setAppointments(mockAppointments);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchAppointments();
    }
  }, [status, session, router]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(current => 
      direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1)
    );
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.date), date)
    );
  };

  const getStatusColor = (status: Appointment['status']) => {
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-gray-500">
            Manage your appointments and service schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {daysInWeek.map((date, index) => (
          <div key={date.toString()} className="space-y-2">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">
                {format(date, 'EEE')}
              </div>
              <div className={`text-lg font-semibold ${
                isSameDay(date, new Date()) ? 'text-green-600' : 'text-gray-900'
              }`}>
                {format(date, 'd')}
              </div>
            </div>
            <div className="space-y-2">
              {getAppointmentsForDay(date).map(appointment => (
                <Card key={appointment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.startTime}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{appointment.customerName}</h3>
                        <p className="text-sm text-gray-500">{appointment.serviceType}</p>
                      </div>
                      <div className="flex items-start text-sm text-gray-500">
                        <MapPin className="h-3 w-3 mr-1 mt-1 flex-shrink-0" />
                        <span className="line-clamp-2">{appointment.address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 