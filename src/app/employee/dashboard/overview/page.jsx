'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
    const router = useRouter();
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [stats, setStats] = useState({
        todayServices: 0,
        completedServices: 0,
        totalEarnings: 0,
        upcomingServices: []
    });

    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/employee/dashboard/stats', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load dashboard stats');
        } finally {
            setLoadingStats(false);
        }
    };

    if (loading || loadingStats) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <Button onClick={fetchStats}>
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Today's Services</h3>
                    <p className="text-3xl font-bold mt-2">{stats.todayServices}</p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Completed Services</h3>
                    <p className="text-3xl font-bold mt-2">{stats.completedServices}</p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
                    <p className="text-3xl font-bold mt-2">${stats.totalEarnings.toFixed(2)}</p>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Upcoming Services</h2>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {stats.upcomingServices.length === 0 ? (
                            <p className="text-center text-gray-500">No upcoming services</p>
                        ) : (
                            stats.upcomingServices.map((service) => (
                                <div
                                    key={service.id}
                                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{service.customerName}</h3>
                                            <p className="text-gray-600">{service.address}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(service.scheduledTime).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/employee/services/${service.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
}
