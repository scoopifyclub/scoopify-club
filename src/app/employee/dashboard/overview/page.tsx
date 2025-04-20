'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, DollarSign, TrendingUp, Users, CheckSquare } from 'lucide-react';

interface DashboardStats {
  totalEarnings: number;
  completedJobs: number;
  activeCustomers: number;
  upcomingJobs: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    time: string;
  }>;
}

export default function OverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    completedJobs: 0,
    activeCustomers: 0,
    upcomingJobs: 0,
    recentActivity: []
  });
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

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, using mock data
        setStats({
          totalEarnings: 1250,
          completedJobs: 45,
          activeCustomers: 12,
          upcomingJobs: 8,
          recentActivity: [
            {
              id: '1',
              type: 'job_completed',
              description: 'Completed yard cleanup at 123 Main St',
              time: '2 hours ago'
            },
            {
              id: '2',
              type: 'payment_received',
              description: 'Received payment for weekly service',
              time: '4 hours ago'
            },
            {
              id: '3',
              type: 'new_customer',
              description: 'New customer assigned: John Smith',
              time: '6 hours ago'
            }
          ]
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchDashboardData();
    }
  }, [status, session, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not an employee
  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE')) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}! Here's what's happening with your account.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <h3 className="text-2xl font-bold text-gray-900">${stats.totalEarnings}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.completedJobs}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Customers</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Jobs</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.upcomingJobs}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest updates and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'job_completed' ? 'bg-green-100' :
                    activity.type === 'payment_received' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'job_completed' ? (
                      <CheckSquare className={`w-5 h-5 ${
                        activity.type === 'job_completed' ? 'text-green-600' :
                        activity.type === 'payment_received' ? 'text-blue-600' :
                        'text-purple-600'
                      }`} />
                    ) : activity.type === 'payment_received' ? (
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Users className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <Badge variant="outline">{activity.type.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 