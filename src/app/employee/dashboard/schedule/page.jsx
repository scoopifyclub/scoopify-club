'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function SchedulePage() {
    const { user, loading } = useAuth({ requiredRole: 'EMPLOYEE' });
    const router = useRouter();
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch appointments data
        const fetchAppointments = async () => {
            try {
                const response = await fetch('/api/employee/appointments');
                if (!response.ok) {
                    throw new Error('Failed to fetch appointments');
                }
                const data = await response.json();
                setAppointments(data);
            } catch (error) {
                console.error('Error fetching appointments:', error);
                toast.error('Failed to load appointments');
                // Fallback to mock data in development
                if (process.env.NODE_ENV === 'development') {
                    const mockAppointments = [
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
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'EMPLOYEE') {
            fetchAppointments();
        }
    }, [user]);

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const getAppointmentsForDay = (date) => {
        return appointments.filter(appointment => 
            isSameDay(new Date(appointment.date), date)
        ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const handlePreviousWeek = () => {
        setCurrentWeek(subWeeks(currentWeek, 1));
    };

    const handleNextWeek = () => {
        setCurrentWeek(addWeeks(currentWeek, 1));
    };

    const getStatusBadgeColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-500';
            case 'scheduled':
                return 'bg-blue-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Schedule</h1>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousWeek}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextWeek}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {daysInWeek.map((day) => (
                    <div key={day.toString()} className="space-y-4">
                        <div className="text-center font-semibold p-2 bg-gray-100 rounded-t-lg">
                            {format(day, 'EEE')}<br />
                            {format(day, 'MMM d')}
                        </div>
                        <div className="space-y-2">
                            {getAppointmentsForDay(day).map((appointment) => (
                                <Card key={appointment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className={getStatusBadgeColor(appointment.status)}>
                                                {appointment.status}
                                            </Badge>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {appointment.startTime} - {appointment.endTime}
                                            </div>
                                        </div>
                                        <h3 className="font-medium mb-1">{appointment.customerName}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{appointment.serviceType}</p>
                                        <div className="flex items-start text-sm text-gray-500">
                                            <MapPin className="h-4 w-4 mr-1 mt-1 flex-shrink-0" />
                                            <span>{appointment.address}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {getAppointmentsForDay(day).length === 0 && (
                                <div className="text-center text-gray-500 text-sm py-4">
                                    No appointments
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
