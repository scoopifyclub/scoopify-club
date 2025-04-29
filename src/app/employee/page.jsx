'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export const dynamic = 'force-dynamic';

export default function EmployeeRedirectPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // If not client-side yet, show loading state
    if (!isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    // Initialize session after client-side hydration
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth/login?callbackUrl=/employee/dashboard');
        },
    });

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.role !== 'EMPLOYEE') {
            router.push('/');
            return;
        }

        router.push('/employee/dashboard/overview');
    }, [router, session, status]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
    );
}
