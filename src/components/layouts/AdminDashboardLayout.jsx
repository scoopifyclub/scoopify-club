'use client';

import Footer from '@/components/Footer';
import { AdminNav } from '@/components/AdminNav';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AdminDashboardLayout({ children }) {
    const { user, status } = useAuth({ required: true, role: 'ADMIN' });
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
            router.push('/admin/login');
        }
    }, [user, status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="w-64 flex-shrink-0">
                        <div className="sticky top-8">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Panel</h2>
                                <p className="text-sm text-gray-600">Welcome, {user?.firstName || 'Admin'}</p>
                            </div>
                            <AdminNav />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
