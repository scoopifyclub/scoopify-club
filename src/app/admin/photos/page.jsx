'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PhotoMap } from '@/components/PhotoMap';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function AdminPhotosPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // If not client-side yet, show loading state
    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>
        );
    }

    // Initialize session after client-side hydration
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth/login?callbackUrl=/admin/photos');
        },
    });

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/admin/photos/map');
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            const data = await response.json();
            setServices(data.services);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch services');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        fetchServices();
    }, [session, status, router]);

    return (<div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Service Photos Map</h1>
        <Button onClick={fetchServices} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
          Refresh
        </Button>
      </div>

      {error && (<div className="p-4 mb-6 text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>)}

      {loading ? (<div className="flex items-center justify-center h-[600px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
        </div>) : services.length === 0 ? (<div className="flex items-center justify-center h-[600px] text-gray-500">
          No services with photos found
        </div>) : (<PhotoMap services={services}/>)}
    </div>);
}
