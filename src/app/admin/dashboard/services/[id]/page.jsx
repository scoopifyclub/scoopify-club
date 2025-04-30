'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ServiceDetails from '@/components/admin/ServiceDetails';

export default function AdminServicePage({ params }) {
    const { id } = params;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return <div>Loading...</div>;
    }

    if (!user || user.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="container mx-auto p-4">
            <ServiceDetails serviceId={id} />
        </div>
    );
}
