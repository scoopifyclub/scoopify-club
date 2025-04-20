'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  date: Date;
  startTime: string;
  endTime: string;
  serviceType: string;
  status: 'scheduled' | 'completed' | 'canceled';
}

export default function EmployeeSchedulePage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));

  useEffect(() => {
    const fetchSchedule = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // In a real app, you would fetch this data from your API
          // This is just mock data for demonstration
          setTimeout(() => {
            const mockAppointments: Appointment[] = [];
            
            // Generate mock appointments for this week and next
            for (let i = 0; i < 10; i++) {
              const day = addDays(new Date(), i % 7);
              mockAppointments.push({
                id: `app-${i}`,
                customerId: `cust-${i}`,
                customerName: `Customer ${i + 1}`,
                address: `${100 + i} Main St, Anytown, US`,
                date: day,
                startTime: `${9 + (i % 8)}:00 ${(i % 8) < 3 ? 'AM' : 'PM'}`,
                endTime: `${10 + (i % 8)}:30 ${(i % 8) < 2 ? 'AM' : 'PM'}`,
                serviceType: i % 2 === 0 ? 'Regular Service' : 'Deep Clean',
                status: i % 5 === 0 ? 'completed' : (i % 7 === 0 ? 'canceled' : 'scheduled'),
              });
            }
            
            setAppointments(mockAppointments);
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          console.error('Error fetching schedule data:', error);
          setIsLoading(false);
        }
      }
    };
    
    fetchSchedule();
  }, [session, status]);

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeek, i));
    }
    return days;
  };

  const weekDays = getWeekDays();

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prevWeek => 
      direction === 'next' 
        ? addWeeks(prevWeek, 1) 
        : addWeeks(prevWeek, -1)
    );
  };

  const appointmentsForDay = (date: Date) => {
    return appointments.filter(app => 
      format(app.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
        <p className="text-gray-500">
          Manage your upcoming services and appointments.
        </p>
      </div>
      
      {/* Calendar Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigateWeek('prev')}
        >
          Previous Week
        </Button>
        
        <h2 className="text-lg font-medium">
          {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
        </h2>
        
        <Button 
          variant="outline" 
          onClick={() => navigateWeek('next')}
        >
          Next Week
        </Button>
      </div>
      
      {/* Weekly Calendar */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col">
            <div className={`text-center p-2 rounded-t-lg 
              ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100'}`}>
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm">{format(day, 'MMM d')}</div>
            </div>
            
            <div className="bg-white rounded-b-lg border flex-1 p-2 min-h-[150px]">
              {appointmentsForDay(day).length > 0 ? (
                <div className="space-y-2">
                  {appointmentsForDay(day).map(app => (
                    <div 
                      key={app.id} 
                      className={`p-2 rounded text-sm border-l-4 ${
                        app.status === 'completed' ? 'border-green-500 bg-green-50' :
                        app.status === 'canceled' ? 'border-red-500 bg-red-50 opacity-60' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="font-medium">{app.startTime}</div>
                      <div className="truncate">{app.customerName}</div>
                      <Badge variant={
                        app.status === 'completed' ? 'success' :
                        app.status === 'canceled' ? 'destructive' :
                        'default'
                      }>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No appointments
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled services for the next few days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments
              .filter(app => app.status === 'scheduled')
              .slice(0, 5)
              .map(app => (
                <div key={app.id} className="flex border rounded-lg p-3 group hover:bg-gray-50">
                  <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-lg flex flex-col items-center justify-center mr-4">
                    <span className="text-lg font-bold text-green-700">
                      {format(app.date, 'd')}
                    </span>
                    <span className="text-xs text-green-700">
                      {format(app.date, 'MMM')}
                    </span>
                  </div>
                  
                  <div className="flex-grow">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      {app.customerName}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      {app.startTime} - {app.endTime}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {app.address}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 flex flex-col justify-between items-end">
                    <Badge>{app.serviceType}</Badge>
                    <div className="hidden group-hover:flex gap-2 mt-2">
                      <Button variant="outline" size="sm">Complete</Button>
                      <Button variant="outline" size="sm" className="text-red-500">Cancel</Button>
                    </div>
                  </div>
                </div>
              ))}
            
            {appointments.filter(app => app.status === 'scheduled').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No upcoming appointments scheduled</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 