'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-auth';

export function ProtectedRoute({ children, role }) {
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
