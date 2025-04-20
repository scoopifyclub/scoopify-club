'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Calendar, Landmark, Users, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeeOverviewPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    upcomingServices: 0,
    completedServices: 0,
    totalEarnings: 0,
    assignedCustomers: 0,
    weeklyHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // In a real app, you would fetch this data from your API
          // This is just mock data for demonstration
          setTimeout(() => {
            setStats({
              upcomingServices: 5,
              completedServices: 27,
              totalEarnings: 1270,
              assignedCustomers: 8,
              weeklyHours: 28
            });
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setIsLoading(false);
        }
      }
    };
    
    fetchDashboardData();
  }, [session, status]);

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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500">
          Welcome back! Here's what's happening with your schedule.
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Services</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingServices}</div>
            <p className="text-xs text-gray-500">Scheduled for this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedServices}</div>
            <p className="text-xs text-gray-500">Jobs completed this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Landmark className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings}</div>
            <p className="text-xs text-gray-500">Earnings this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Customers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedCustomers}</div>
            <p className="text-xs text-gray-500">Regular clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyHours}</div>
            <p className="text-xs text-gray-500">Average hours per week</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Schedule */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Upcoming Schedule</CardTitle>
          <CardDescription>Your next services and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-3 rounded-lg bg-green-50">
                <div className="flex-shrink-0 bg-green-500 text-white rounded-lg w-12 h-12 flex items-center justify-center mr-4">
                  <span className="font-bold">{`${i + 9}`}</span>
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold">Customer {i}</h4>
                  <p className="text-sm text-gray-500">123 Main St, Apt {i}05</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-medium">
                    {new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">{`${i + 1}:00 PM - ${i + 3}:00 PM`}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 