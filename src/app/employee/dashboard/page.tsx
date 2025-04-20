'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PaymentInfoReminder from '@/components/PaymentInfoReminder';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  
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
    
    // Redirect to the overview tab when dashboard root is accessed
    router.replace('/employee/dashboard?tab=overview');
    
    // Fetch employee data
    const fetchEmployeeData = async () => {
      try {
        // ... existing code to fetch employee data ...
        
        // Check if the response includes payment information
        const hasPaymentInfo = !!data.cashAppUsername || !!data.stripeAccountId;
        const hasPaymentMethod = hasPaymentInfo;
        const preferredMethodSelected = !!data.preferredPaymentMethod;
        
        setEmployeeData({
          ...data,
          hasPaymentInfo,
          hasPaymentMethod,
          preferredMethodSelected
        });
        
        // ... existing code ...
      } catch (error) {
        // ... existing error handling ...
      }
    };
  }, [router, session, status]);
  
  // Return a loading indicator while redirecting
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">Today is {currentDate}</p>
        </div>
      </div>

      {/* Payment Info Reminder */}
      {employeeData && (
        <PaymentInfoReminder 
          userType="employee" 
          hasPaymentInfo={employeeData.hasPaymentInfo}
          hasPaymentMethod={employeeData.hasPaymentMethod}
          preferredMethodSelected={employeeData.preferredMethodSelected}
        />
      )}
      
      {/* Rest of the dashboard content */}
      {/* ... existing code ... */}
    </div>
  );
} 