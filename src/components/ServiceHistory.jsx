// Service History and Tracking Component
// For subscription-based business model with weekly services
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Camera, Star, Download, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { StatCard, ProgressBar, ActivityFeed } from '@/components/ui/data-visualization';
import { cn } from '@/lib/utils';

const ServiceHistory = ({
  customerId,
  className,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    status: 'all',
    serviceType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockServiceHistory = [
    {
      id: 1,
      date: '2024-01-15',
      status: 'completed',
      serviceType: 'Premium Weekly Service',
      employee: 'John Smith',
      duration: '45 minutes',
      notes: 'Service completed successfully. Yard was well-maintained.',
      photos: ['photo1.jpg', 'photo2.jpg'],
      rating: 5,
      address: '123 Main St, Peyton, CO',
      specialInstructions: 'Gate code: 1234'
    },
    {
      id: 2,
      date: '2024-01-08',
      status: 'completed',
      serviceType: 'Premium Weekly Service',
      employee: 'Sarah Johnson',
      duration: '50 minutes',
      notes: 'Heavy cleanup required due to recent rain.',
      photos: ['photo3.jpg'],
      rating: 4,
      address: '123 Main St, Peyton, CO',
      specialInstructions: 'Gate code: 1234'
    },
    {
      id: 3,
      date: '2024-01-01',
      status: 'completed',
      serviceType: 'Premium Weekly Service',
      employee: 'Mike Wilson',
      duration: '40 minutes',
      notes: 'Standard weekly service completed.',
      photos: ['photo4.jpg', 'photo5.jpg'],
      rating: 5,
      address: '123 Main St, Peyton, CO',
      specialInstructions: 'Gate code: 1234'
    },
    {
      id: 4,
      date: '2024-12-25',
      status: 'rescheduled',
      serviceType: 'Premium Weekly Service',
      employee: null,
      duration: null,
      notes: 'Service rescheduled due to Christmas holiday.',
      photos: [],
      rating: null,
      address: '123 Main St, Peyton, CO',
      specialInstructions: 'Gate code: 1234'
    }
  ];

  const mockSubscriptionData = {
    serviceType: 'Premium Weekly Service',
    monthlyPrice: 140,
    preferredDay: 'Monday',
    preferredTime: 'Morning (8 AM - 12 PM)',
    address: '123 Main St, Peyton, CO',
    startDate: '2024-01-01',
    status: 'active',
    nextServiceDate: '2024-01-22',
    nextBillingDate: '2024-02-01',
    totalServices: 52,
    completedServices: 48,
    averageRating: 4.8,
    addOns: ['Sanitizer Treatment', 'Extra Pets']
  };

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setServiceHistory(mockServiceHistory);
        setSubscriptionData(mockSubscriptionData);
      } catch (error) {
        console.error('Error loading service history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [customerId]);

  const filteredHistory = serviceHistory.filter(service => {
    const matchesSearch = service.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || service.status === filters.status;
    const matchesServiceType = filters.serviceType === 'all' || service.serviceType === filters.serviceType;
    
    return matchesSearch && matchesStatus && matchesServiceType;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'default', icon: CheckCircle, text: 'Completed' },
      scheduled: { variant: 'secondary', icon: Clock, text: 'Scheduled' },
      in_progress: { variant: 'secondary', icon: Clock, text: 'In Progress' },
      rescheduled: { variant: 'outline', icon: AlertCircle, text: 'Rescheduled' },
      cancelled: { variant: 'destructive', icon: AlertCircle, text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.completed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getRatingStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-4 h-4",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Subscription Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Summary</CardTitle>
          <CardDescription>Your current service plan and upcoming schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Service Details</h4>
              <p className="text-sm text-gray-600">{subscriptionData?.serviceType}</p>
              <p className="text-sm text-gray-600">${subscriptionData?.monthlyPrice}/month</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Schedule</h4>
              <p className="text-sm text-gray-600">Every {subscriptionData?.preferredDay}</p>
              <p className="text-sm text-gray-600">{subscriptionData?.preferredTime}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Next Service</h4>
              <p className="text-sm text-gray-600">{subscriptionData?.nextServiceDate}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Next Billing</h4>
              <p className="text-sm text-gray-600">{subscriptionData?.nextBillingDate}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Service Progress</h4>
            <ProgressBar
              value={(subscriptionData?.completedServices / subscriptionData?.totalServices) * 100}
              max={100}
              label={`${subscriptionData?.completedServices} of ${subscriptionData?.totalServices} services completed`}
              color="primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Services"
          value={subscriptionData?.totalServices || 0}
          icon={Calendar}
          change={null}
        />
        <StatCard
          title="Average Rating"
          value={subscriptionData?.averageRating || 0}
          subtitle="out of 5"
          icon={Star}
          change={null}
        />
        <StatCard
          title="Completion Rate"
          value={`${Math.round((subscriptionData?.completedServices / subscriptionData?.totalServices) * 100)}%`}
          icon={CheckCircle}
          change={null}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={serviceHistory.slice(0, 5).map(service => ({
              id: service.id,
              title: `${service.serviceType} - ${service.date}`,
              description: service.notes || 'Service completed',
              timestamp: service.date,
              status: service.status,
              icon: service.status === 'completed' ? CheckCircle : Clock
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderServiceHistory = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search services, notes, or employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.serviceType} onValueChange={(value) => setFilters(prev => ({ ...prev, serviceType: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Basic Weekly Service">Basic</SelectItem>
                  <SelectItem value="Premium Weekly Service">Premium</SelectItem>
                  <SelectItem value="Deluxe Weekly Service">Deluxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service History List */}
      <div className="space-y-4">
        {filteredHistory.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{service.serviceType}</h3>
                      <p className="text-sm text-gray-600">{service.date}</p>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{service.address}</span>
                    </div>
                    {service.employee && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.employee} • {service.duration}</span>
                      </div>
                    )}
                  </div>

                  {service.notes && (
                    <p className="text-sm text-gray-700 mb-3">{service.notes}</p>
                  )}

                  {service.specialInstructions && (
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>Special Instructions:</strong> {service.specialInstructions}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {service.rating && getRatingStars(service.rating)}
                    
                    <div className="flex items-center gap-2">
                      {service.photos.length > 0 && (
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-1" />
                          {service.photos.length} Photos
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredHistory.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-gray-500">No services found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Service Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-sm text-gray-600">4/4 (100%)</span>
              </div>
              <ProgressBar value={100} max={100} color="success" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Month</span>
                <span className="text-sm text-gray-600">3/4 (75%)</span>
              </div>
              <ProgressBar value={75} max={100} color="warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">5 Stars</span>
                <div className="flex items-center gap-2">
                  <ProgressBar value={80} max={100} className="w-20" />
                  <span className="text-sm text-gray-600">80%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">4 Stars</span>
                <div className="flex items-center gap-2">
                  <ProgressBar value={15} max={100} className="w-20" />
                  <span className="text-sm text-gray-600">15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">3 Stars</span>
                <div className="flex items-center gap-2">
                  <ProgressBar value={5} max={100} className="w-20" />
                  <span className="text-sm text-gray-600">5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Service Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4</div>
              <div className="text-sm text-gray-600">Services This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">4.8</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$140</div>
              <div className="text-sm text-gray-600">Monthly Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className={cn("space-y-6", className)} {...props}>
        <LoadingOverlay isLoading={true} message="Loading service history..." />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service History</h1>
          <p className="text-gray-600">Track your weekly services and subscription details</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export History
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {renderServiceHistory()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceHistory;
