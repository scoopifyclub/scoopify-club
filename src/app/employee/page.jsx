'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

export default function EmployeeRedirectPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'EMPLOYEE',
        redirectTo: '/auth/login?callbackUrl=/employee/dashboard'
    });
    const [isClient, setIsClient] = useState(false);

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!user) return;
        router.push('/employee/dashboard/overview');
    }, [router, user]);

    // If not client-side yet or still authenticating, show loading state
    if (!isClient || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
    );
}
