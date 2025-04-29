'use client';
import { useEffect, useState } from 'react';
import { PhotoMap } from '@/components/PhotoMap';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AdminPhotosPage() {
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'ADMIN',
        redirectTo: '/auth/login?callbackUrl=/admin/photos'
    });

    const [isClient, setIsClient] = useState(false);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set isClient to true on mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('/api/admin/photos/map');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch services');
                }

                const data = await response.json();
                setServices(data.services);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch services';
                setError(errorMessage);
                toast.error(errorMessage);
                console.error('Error fetching services:', err);
                
                // Fallback to mock data in development
                if (process.env.NODE_ENV === 'development') {
                    setServices([
                        {
                            id: '1',
                            address: '123 Main St, Anytown, USA',
                            location: { lat: 37.7749, lng: -122.4194 },
                            photos: [
                                {
                                    id: '1',
                                    url: 'https://example.com/photo1.jpg',
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        }
                    ]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleRefresh = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/admin/photos/map');
            
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }

            const data = await response.json();
            setServices(data.services);
            toast.success('Map data refreshed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch services';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Error refreshing services:', err);
        } finally {
            setLoading(false);
        }
    };

    // If not client-side yet, show loading state
    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>
        );
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Service Photos Map</h1>
                    <p className="text-gray-500">
                        {services.length} service{services.length === 1 ? '' : 's'} with photos
                    </p>
                </div>
                <Button 
                    onClick={handleRefresh} 
                    disabled={loading} 
                    variant="outline"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <p className="font-medium">Error loading map data</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
                    <p className="mb-2">No services with photos found</p>
                    <p className="text-sm text-gray-400">
                        Photos will appear here once employees start uploading them
                    </p>
                </div>
            ) : (
                <PhotoMap services={services}/>
            )}
        </div>
    );
}
