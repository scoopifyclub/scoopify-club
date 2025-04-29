'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function EmployeeJobsRedirect() {
    const router = useRouter();
    const { user, loading } = useAuth({ 
        requiredRole: 'EMPLOYEE',
        redirectTo: '/auth/login?callbackUrl=/employee/dashboard/jobs'
    });

    useEffect(() => {
        if (!user) return;
        router.push('/employee/dashboard/jobs');
    }, [router, user]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
    );
}
