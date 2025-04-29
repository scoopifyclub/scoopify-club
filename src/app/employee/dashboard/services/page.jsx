'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function ServicesPage() {
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchServices();
        }
    }, [user]);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/employee/services', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            const data = await response.json();
            setServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoadingServices(false);
        }
    };

    const handleServiceAction = async (serviceId, action) => {
        try {
            const response = await fetch(`/api/employee/services/${serviceId}/${action}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error(`Failed to ${action} service`);
            }
            await fetchServices(); // Refresh services list
            toast.success(`Service ${action} successfully`);
        } catch (error) {
            console.error(`Error ${action}ing service:`, error);
            toast.error(`Failed to ${action} service`);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            inProgress: { class: 'bg-blue-100 text-blue-800', text: 'In Progress' },
            completed: { class: 'bg-green-100 text-green-800', text: 'Completed' },
            cancelled: { class: 'bg-red-100 text-red-800', text: 'Cancelled' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Badge className={config.class}>
                {config.text}
            </Badge>
        );
    };

    if (loading || loadingServices) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Services</h1>
                <Button onClick={() => fetchServices()}>
                    Refresh
                </Button>
            </div>

            <Card className="p-6">
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                        {services.length === 0 ? (
                            <p className="text-center text-gray-500">No services assigned</p>
                        ) : (
                            services.map((service) => (
                                <div
                                    key={service.id}
                                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{service.customerName}</h3>
                                                {getStatusBadge(service.status)}
                                            </div>
                                            <p className="text-gray-600">{service.address}</p>
                                            <p className="text-sm text-gray-500">
                                                Scheduled: {new Date(service.scheduledTime).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {service.status === 'pending' && (
                                                <Button
                                                    onClick={() => handleServiceAction(service.id, 'start')}
                                                    variant="outline"
                                                >
                                                    Start
                                                </Button>
                                            )}
                                            {service.status === 'inProgress' && (
                                                <Button
                                                    onClick={() => handleServiceAction(service.id, 'complete')}
                                                    variant="outline"
                                                >
                                                    Complete
                                                </Button>
                                            )}
                                        </div>
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
