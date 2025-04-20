'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the overview tab by default
    router.replace('/employee/dashboard?tab=overview');
  }, [router]);
  
  return null;
} 