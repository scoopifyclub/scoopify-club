'use client';

import React from 'react';

export default function ServiceDetails({ serviceId }) {
    const [service, setService] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        async function fetchService() {
            try {
                const response = await fetch(`/api/services/${serviceId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch service details');
                }
                const data = await response.json();
                setService(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (serviceId) {
            fetchService();
        }
    }, [serviceId]);

    if (loading) return <div>Loading service details...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!service) return <div>No service found</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Service Details</h1>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Status</h2>
                    <p>{service.status}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Customer</h2>
                    <p>{service.customer?.name || 'N/A'}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Employee</h2>
                    <p>{service.employee?.name || 'Not assigned'}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Schedule</h2>
                    <p>Date: {new Date(service.scheduledDate).toLocaleDateString()}</p>
                    <p>Time: {new Date(service.scheduledDate).toLocaleTimeString()}</p>
                </div>
                {service.notes && (
                    <div>
                        <h2 className="text-lg font-semibold">Notes</h2>
                        <p>{service.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
} 