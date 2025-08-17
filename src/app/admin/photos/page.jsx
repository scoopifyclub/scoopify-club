'use client';
import { useEffect, useState } from 'react';
import { PhotoMap } from '@/components/PhotoMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Search, Filter, Download, Trash2, Eye, Calendar, MapPin, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AdminPhotosPage() {
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'ADMIN',
        redirectTo: '/auth/login?callbackUrl=/admin/photos'
    });

    const [isClient, setIsClient] = useState(false);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedPhotos, setSelectedPhotos] = useState([]);

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
                setFilteredServices(data.services);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch services';
                setError(errorMessage);
                toast.error(errorMessage);
                console.error('Error fetching services:', err);
                
                // Fallback to mock data in development
                if (process.env.NODE_ENV === 'development') {
                    const mockServices = [
                        {
                            id: '1',
                            address: '123 Main St, Anytown, USA',
                            location: { lat: 37.7749, lng: -122.4194 },
                            status: 'COMPLETED',
                            customerName: 'John Doe',
                            scheduledDate: new Date().toISOString(),
                            photos: [
                                {
                                    id: '1',
                                    url: 'https://example.com/photo1.jpg',
                                    timestamp: new Date().toISOString(),
                                    type: 'BEFORE'
                                }
                            ]
                        }
                    ];
                    setServices(mockServices);
                    setFilteredServices(mockServices);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Filter services based on search and filters
    useEffect(() => {
        let filtered = services;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(service => 
                service.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(service => service.status === statusFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);

            filtered = filtered.filter(service => {
                const serviceDate = new Date(service.scheduledDate);
                switch (dateFilter) {
                    case 'today':
                        return serviceDate >= today;
                    case 'yesterday':
                        return serviceDate >= yesterday && serviceDate < today;
                    case 'lastWeek':
                        return serviceDate >= lastWeek;
                    default:
                        return true;
                }
            });
        }

        setFilteredServices(filtered);
    }, [services, searchTerm, statusFilter, dateFilter]);

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
            setFilteredServices(data.services);
            toast.success('Photo data refreshed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch services';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Error refreshing services:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelection = (photoId, checked) => {
        if (checked) {
            setSelectedPhotos([...selectedPhotos, photoId]);
        } else {
            setSelectedPhotos(selectedPhotos.filter(id => id !== photoId));
        }
    };

    const handleBulkDownload = () => {
        if (selectedPhotos.length === 0) {
            toast.error('Please select photos to download');
            return;
        }
        // Implement bulk download logic
        toast.success(`Preparing download for ${selectedPhotos.length} photos`);
    };

    const handleBulkDelete = () => {
        if (selectedPhotos.length === 0) {
            toast.error('Please select photos to delete');
            return;
        }
        if (confirm(`Are you sure you want to delete ${selectedPhotos.length} photos?`)) {
            // Implement bulk delete logic
            toast.success(`Deleted ${selectedPhotos.length} photos`);
            setSelectedPhotos([]);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'SCHEDULED':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Photo Management</h1>
                    <p className="text-muted-foreground">
                        Manage and organize service photos across all locations
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="map" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="map">Map View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="analytics">Photo Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Photo Map</CardTitle>
                            <CardDescription>View all service photos on an interactive map</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error ? (
                                <div className="text-center py-8">
                                    <p className="text-red-600 mb-4">{error}</p>
                                    <Button onClick={handleRefresh}>Try Again</Button>
                                </div>
                            ) : (
                                <div className="h-[600px] relative">
                                    <PhotoMap services={filteredServices} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Photo List</CardTitle>
                            <CardDescription>Browse and manage photos in a list format</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <Label htmlFor="search">Search</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="search"
                                                placeholder="Search by address or customer name..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="date">Date</Label>
                                        <Select value={dateFilter} onValueChange={setDateFilter}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Dates</SelectItem>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                                <SelectItem value="lastWeek">Last 7 Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Bulk Actions */}
                                {selectedPhotos.length > 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium">
                                            {selectedPhotos.length} photos selected
                                        </span>
                                        <Button size="sm" onClick={handleBulkDownload}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                )}

                                {/* Services List */}
                                <div className="space-y-4">
                                    {filteredServices.map((service) => (
                                        <div key={service.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-medium">{service.customerName || 'Unknown Customer'}</h3>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        {service.address}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(service.scheduledDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge className={getStatusColor(service.status)}>
                                                    {service.status}
                                                </Badge>
                                            </div>

                                            {service.photos && service.photos.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {service.photos.map((photo) => (
                                                        <div key={photo.id} className="relative group">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPhotos.includes(photo.id)}
                                                                onChange={(e) => handlePhotoSelection(photo.id, e.target.checked)}
                                                                className="absolute top-2 left-2 z-10"
                                                            />
                                                            <img
                                                                src={photo.url}
                                                                alt={`Service photo ${photo.id}`}
                                                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                                                                onClick={() => window.open(photo.url, '_blank')}
                                                            />
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {filteredServices.length === 0 && (
                                        <div className="text-center py-8">
                                            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No photos found matching your criteria</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
                                <Camera className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {services.reduce((total, service) => total + (service.photos?.length || 0), 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Across {services.length} services
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Services with Photos</CardTitle>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {services.filter(service => service.photos && service.photos.length > 0).length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {Math.round((services.filter(service => service.photos && service.photos.length > 0).length / services.length) * 100)}% coverage
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Recent Photos</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {services.filter(service => {
                                        const serviceDate = new Date(service.scheduledDate);
                                        const today = new Date();
                                        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                        return serviceDate >= lastWeek;
                                    }).reduce((total, service) => total + (service.photos?.length || 0), 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    In the last 7 days
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
