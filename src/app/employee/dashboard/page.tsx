'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeDashboardLayout } from '@/components/layouts/EmployeeDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EmployeeData {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    image?: string;
  };
  status: string;
  startDate: string;
}

interface ServiceAssignment {
  id: string;
  status: string;
  scheduledDate: string;
  customer: {
    user: {
      name: string;
      email: string;
    };
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  servicePlan: {
    name: string;
    price: number;
    duration: number;
  };
}

export default function EmployeeDashboard() {
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch employee data');
        }

        const data = await response.json();
        
        // Check if user is an employee
        if (data.user.role !== 'EMPLOYEE') {
          // Redirect based on role
          if (data.user.role === 'CUSTOMER') {
            router.push('/dashboard');
          } else if (data.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          }
          return;
        }

        setEmployeeData(data.user.employee);
        
        // Fetch assignments
        const assignmentsResponse = await fetch('/api/employee/assignments', {
          credentials: 'include'
        });
        
        if (!assignmentsResponse.ok) {
          throw new Error('Failed to fetch assignments');
        }
        
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [router]);

  if (loading) {
    return (
      <EmployeeDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </EmployeeDashboardLayout>
    );
  }

  if (error) {
    return (
      <EmployeeDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </EmployeeDashboardLayout>
    );
  }

  return (
    <EmployeeDashboardLayout>
      <div className="grid gap-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {employeeData?.user.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Here's your overview for today</p>
          </CardContent>
        </Card>

        {/* Today's Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments
                .filter(assignment => 
                  format(new Date(assignment.scheduledDate), 'yyyy-MM-dd') === 
                  format(new Date(), 'yyyy-MM-dd')
                )
                .map(assignment => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{assignment.customer.user.name}</h3>
                        <p className="text-sm text-gray-600">
                          {assignment.servicePlan.name} - {format(new Date(assignment.scheduledDate), 'h:mm a')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {assignment.customer.address.street}, {assignment.customer.address.city}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              {assignments.filter(assignment => 
                format(new Date(assignment.scheduledDate), 'yyyy-MM-dd') === 
                format(new Date(), 'yyyy-MM-dd')
              ).length === 0 && (
                <p className="text-gray-600 text-center py-4">No assignments for today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments
                .filter(assignment => 
                  new Date(assignment.scheduledDate) > new Date() &&
                  format(new Date(assignment.scheduledDate), 'yyyy-MM-dd') !== 
                  format(new Date(), 'yyyy-MM-dd')
                )
                .slice(0, 5)
                .map(assignment => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{assignment.customer.user.name}</h3>
                        <p className="text-sm text-gray-600">
                          {assignment.servicePlan.name} - {format(new Date(assignment.scheduledDate), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {assignment.customer.address.street}, {assignment.customer.address.city}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              {assignments.filter(assignment => 
                new Date(assignment.scheduledDate) > new Date() &&
                format(new Date(assignment.scheduledDate), 'yyyy-MM-dd') !== 
                format(new Date(), 'yyyy-MM-dd')
              ).length === 0 && (
                <p className="text-gray-600 text-center py-4">No upcoming assignments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeDashboardLayout>
  );
} 