'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function EmployeeRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/employee/dashboard');
      return;
    }

    if (status === 'authenticated') {
      if (session?.user?.role !== 'EMPLOYEE') {
        router.push('/');
        return;
      }
      router.push('/employee/dashboard/overview');
    }
  }, [router, session, status]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
    </div>
  );
} 