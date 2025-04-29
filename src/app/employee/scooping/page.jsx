'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
export default function ScoopingMode() {
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        const fetchServices = async () => {
            try {
                const response = await fetch('/api/employee/available-services', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok)
                    throw new Error('Failed to fetch services');
                const data = await response.json();
                setServices(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load services');
            }
            finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [router]);
    const handleClaimService = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            const response = await fetch(`/api/employee/services/${serviceId}/claim`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok)
                throw new Error('Failed to claim service');
            // Update the services list
            setServices(services.filter(service => service.id !== serviceId));
            router.push(`/employee/services/${serviceId}/complete`);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to claim service');
        }
    };
    if (loading)
        return <div>Loading...</div>;
    if (error)
        return <div>Error: {error}</div>;
    return (<div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scooping Mode</h1>
        <button onClick={() => router.push('/employee/dashboard')} className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (<div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{service.type}</h2>
                <p className="text-gray-600">
                  {format(new Date(service.scheduledFor), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <span className={`px-2 py-1 rounded ${service.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                service.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'}`}>
                {service.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Customer Details</h3>
                <p>{service.customer.name}</p>
                <p>{service.customer.address}</p>
                {service.customer.phone && <p>{service.customer.phone}</p>}
                {service.customer.gateCode && (<p>Gate Code: {service.customer.gateCode}</p>)}
              </div>

              <div>
                <h3 className="font-medium">Service Details</h3>
                <p>Amount: ${service.amount.toFixed(2)}</p>
                {service.description && (<p className="text-sm text-gray-600">{service.description}</p>)}
              </div>

              <button onClick={() => handleClaimService(service.id)} className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                Claim Service
              </button>
            </div>
          </div>))}
      </div>

      {services.length === 0 && (<div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600">No Available Services</h2>
          <p className="text-gray-500 mt-2">Check back later for new services</p>
        </div>)}
    </div>);
}
