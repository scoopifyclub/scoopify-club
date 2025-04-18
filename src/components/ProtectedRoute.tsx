'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (role && user.role !== role) {
        router.push('/');
        return;
      }
    }

    checkAuth();
  }, [router, role]);

  return <>{children}</>;
} 