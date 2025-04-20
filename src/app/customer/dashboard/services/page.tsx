import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format, isAfter } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  User,
  Camera,
  AlarmClock
} from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  type: 'BEFORE' | 'AFTER';
  createdAt: string;
  expiresAt?: string;
}

interface Service {
  id: string;
  status: string;
  scheduledDate: string;
  completedAt: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  employee: {
    id: string;
    name: string;
  } | null;
  notes: string | null;
  photos: Photo[];
}

export default function ServiceHistoryPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('completed');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/services');
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      setServices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load service history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const groupServicesByMonth = (serviceList: Service[]) => {
    return serviceList.reduce((groups: Record<string, Service[]>, service) => {
      const date = new Date(service.scheduledDate);
      const monthYear = format(date, 'MMMM yyyy');
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      
      groups[monthYear].push(service);
      return groups;
    }, {});
  };

  const formatAddress = (address: Service['address']) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPhotoExpired = (photo: Photo) => {
    return photo.expiresAt && isAfter(new Date(), new Date(photo.expiresAt));
  };

  const getPhotoExpiryMessage = (photo: Photo) => {
    if (!photo.expiresAt) return "Photo available";
    
    const expiryDate = new Date(photo.expiresAt);
    const now = new Date();
    
    if (isAfter(now, expiryDate)) {
      return "Photo expired";
    }
    
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return `Available for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
          <Button 
            onClick={fetchServices} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const completedServices = services.filter(s => s.status.toUpperCase() === 'COMPLETED');
  const upcomingServices = services.filter(s => 
    ['SCHEDULED', 'IN_PROGRESS'].includes(s.status.toUpperCase())
  );
  const cancelledServices = services.filter(s => s.status.toUpperCase() === 'CANCELLED');
  
  const completedByMonth = groupServicesByMonth(completedServices);
  const upcomingByDate = groupServicesByMonth(upcomingServices);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Services</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="upcoming" className="text-sm py-2">
            Upcoming ({upcomingServices.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm py-2">
            Completed ({completedServices.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-sm py-2">
            Cancelled ({cancelledServices.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Upcoming Services */}
        <TabsContent value="upcoming">
          {upcomingServices.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No upcoming services</h3>
              <p className="mt-2 text-gray-500">You don't have any scheduled services right now.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(upcomingByDate).map(([date, services]) => (
                <div key={date}>
                  <h3 className="text-xl font-semibold mb-4">{date}</h3>
                  <div className="grid gap-4">
                    {services.map(service => (
                      <Card key={service.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                              <CardTitle className="text-lg">
                                {format(new Date(service.scheduledDate), 'EEEE, MMMM d')}
                              </CardTitle>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                              {service.status}
                            </span>
                          </div>
                          <CardDescription>
                            {format(new Date(service.scheduledDate), 'h:mm a')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                              <p className="text-sm">{formatAddress(service.address)}</p>
                            </div>
                            {service.employee && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                <p className="text-sm">{service.employee.name}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Completed Services */}
        <TabsContent value="completed">
          {completedServices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No completed services</h3>
              <p className="mt-2 text-gray-500">Your completed services will appear here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(completedByMonth).map(([date, services]) => (
                <div key={date}>
                  <h3 className="text-xl font-semibold mb-4">{date}</h3>
                  <div className="grid gap-6">
                    {services.map(service => (
                      <Card key={service.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              {format(new Date(service.scheduledDate), 'EEEE, MMMM d')}
                            </CardTitle>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                              {service.status}
                            </span>
                          </div>
                          <CardDescription>
                            Completed: {service.completedAt ? format(new Date(service.completedAt), 'MMM d, h:mm a') : 'N/A'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                              <p className="text-sm">{formatAddress(service.address)}</p>
                            </div>
                            {service.employee && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                <p className="text-sm">{service.employee.name}</p>
                              </div>
                            )}
                            {service.notes && (
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm font-medium mb-1">Notes:</p>
                                <p className="text-sm">{service.notes}</p>
                              </div>
                            )}
                            
                            {/* Service Photos */}
                            {service.photos && service.photos.length > 0 && (
                              <div className="mt-4">
                                <div className="flex items-center mb-2">
                                  <Camera className="h-4 w-4 mr-2 text-gray-500" />
                                  <p className="text-sm font-medium">Service Photos</p>
                                  <div className="ml-auto flex items-center">
                                    <AlarmClock className="h-3 w-3 mr-1 text-amber-500" />
                                    <p className="text-xs text-amber-600">Photos available for 7 days</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Before Photos */}
                                  {service.photos.filter(p => p.type === 'BEFORE').map(photo => (
                                    <div key={photo.id} className="relative aspect-square">
                                      {isPhotoExpired(photo) ? (
                                        <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                                          <div className="text-center">
                                            <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                                            <p className="text-xs text-gray-500 mt-2">Photo no longer available</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <Image
                                            src={photo.url}
                                            alt="Before service"
                                            fill
                                            className="object-cover rounded-md"
                                          />
                                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white px-2 py-1 text-xs">
                                            <span>Before</span>
                                            <span className="float-right">{getPhotoExpiryMessage(photo)}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {/* After Photos */}
                                  {service.photos.filter(p => p.type === 'AFTER').map(photo => (
                                    <div key={photo.id} className="relative aspect-square">
                                      {isPhotoExpired(photo) ? (
                                        <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                                          <div className="text-center">
                                            <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                                            <p className="text-xs text-gray-500 mt-2">Photo no longer available</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <Image
                                            src={photo.url}
                                            alt="After service"
                                            fill
                                            className="object-cover rounded-md"
                                          />
                                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white px-2 py-1 text-xs">
                                            <span>After</span>
                                            <span className="float-right">{getPhotoExpiryMessage(photo)}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Cancelled Services */}
        <TabsContent value="cancelled">
          {cancelledServices.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No cancelled services</h3>
              <p className="mt-2 text-gray-500">You don't have any cancelled services.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledServices.map(service => (
                <Card key={service.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {format(new Date(service.scheduledDate), 'EEEE, MMMM d')}
                      </CardTitle>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <CardDescription>
                      Scheduled for: {format(new Date(service.scheduledDate), 'h:mm a')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <p className="text-sm">{formatAddress(service.address)}</p>
                      </div>
                      {service.notes && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Cancellation Reason:</p>
                          <p className="text-sm">{service.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 