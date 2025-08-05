'use client';

import { useAuth } from '@/hooks/useAuth';
import { AdminDashboardLayout } from '@/components/layouts/AdminDashboardLayout';
import OperationalEfficiency from '@/components/admin/OperationalEfficiency';

export default function OperationalEfficiencyPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });

    if (status === 'loading') {
        return (
            <AdminDashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </AdminDashboardLayout>
        );
    }

    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                <OperationalEfficiency />
            </div>
        </AdminDashboardLayout>
    );
} 