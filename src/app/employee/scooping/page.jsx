'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { claimJob, JobApiError } from '@/lib/job-api-client';

export default function ScoopingMode() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/employee/available-services', { credentials: 'same-origin' });
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch services');
        }
        const data = await response.json();
        setServices(Array.isArray(data) ? data : data.services || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [router]);

  const handleClaimService = async (serviceId) => {
    setClaimingId(serviceId);
    setError(null);
    try {
      await claimJob(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      router.push(`/employee/services/${serviceId}`);
    } catch (err) {
      if (err instanceof JobApiError && err.status === 401) {
        router.push('/login');
        return;
      }
      setError(err instanceof JobApiError ? err.message : 'Failed to claim service');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error && services.length === 0) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scooping Mode</h1>
        <button onClick={() => router.push('/employee/dashboard')} className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{service.servicePlan?.name || service.type || 'Service'}</h2>
                <p className="text-gray-600">
                  {format(new Date(service.scheduledDate || service.scheduledFor), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <span className={`px-2 py-1 rounded ${
                service.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                service.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {service.status || 'SCHEDULED'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Customer Details</h3>
                <p>{service.customerName || service.customer?.name || 'Customer'}</p>
                <p>
                  {[service.address?.city || service.customer?.address?.city,
                    service.address?.state || service.customer?.address?.state,
                    service.address?.zipCode || service.customer?.address?.zipCode]
                    .filter(Boolean).join(', ') || 'In your service area'}
                </p>
                {service.distanceText && <p className="text-sm text-gray-500">{service.distanceText}</p>}
              </div>

              <div>
                <h3 className="font-medium">Service Details</h3>
                <p>
                  Amount: $
                  {Number(service.estimatedEarnings ?? service.potentialEarnings ?? service.amount ?? 0).toFixed(2)}
                </p>
                {service.description && (
                  <p className="text-sm text-gray-600">{service.description}</p>
                )}
              </div>

              <button
                onClick={() => handleClaimService(service.id)}
                disabled={claimingId === service.id}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                {claimingId === service.id ? 'Claiming...' : 'Claim Service'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600">No Available Services</h2>
          <p className="text-gray-500 mt-2">Check back later for new services</p>
        </div>
      )}
    </div>
  );
}
