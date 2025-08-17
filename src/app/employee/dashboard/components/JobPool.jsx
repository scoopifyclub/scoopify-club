'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  Filter,
  Search,
  Eye,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function JobPool({ employeeId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchAvailableJobs();
  }, [employeeId]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, selectedServiceType, selectedStatus]);

  const fetchAvailableJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/jobs/pool', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job => 
        `${job.customer?.user?.firstName || ''} ${job.customer?.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer?.address?.zipCode?.includes(searchTerm) ||
        job.customer?.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by service type
    if (selectedServiceType !== 'all') {
      filtered = filtered.filter(job => job.servicePlanId === selectedServiceType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    setFilteredJobs(filtered);
  };

  const claimJob = async (jobId) => {
    try {
      const response = await fetch(`/api/employee/jobs/${jobId}/claim`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim job');
      }

      toast.success('Job claimed successfully!');
      // Refresh the job list
      fetchAvailableJobs();
    } catch (error) {
      console.error('Error claiming job:', error);
      toast.error(error.message || 'Failed to claim job');
    }
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
      'weekly-1': 'Weekly (1 Dog)',
      'weekly-2': 'Weekly (2 Dogs)',
      'weekly-3': 'Weekly (3+ Dogs)',
      'one-time-1': 'One-Time (1 Dog)',
      'one-time-2': 'One-Time (2 Dogs)',
      'one-time-3': 'One-Time (3+ Dogs)'
    };
    return labels[serviceType] || serviceType;
  };

  const getStatusBadge = (status) => {
    const variants = {
      'PENDING': 'default',
      'SCHEDULED': 'secondary',
      'IN_PROGRESS': 'warning',
      'COMPLETED': 'success',
      'CANCELLED': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading available jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Available Jobs ({filteredJobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Jobs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by customer name, ZIP, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Service Type Filter */}
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <select
                id="serviceType"
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="weekly-1">Weekly (1 Dog)</option>
                <option value="weekly-2">Weekly (2 Dogs)</option>
                <option value="weekly-3">Weekly (3+ Dogs)</option>
                <option value="one-time-1">One-Time (1 Dog)</option>
                <option value="one-time-2">One-Time (2 Dogs)</option>
                <option value="one-time-3">One-Time (3+ Dogs)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
            <p className="text-gray-500">
              {jobs.length === 0 
                ? "There are no jobs available in your service area right now."
                : "No jobs match your current filters. Try adjusting your search criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredJobs.length} of {jobs.length} available jobs
          </div>
          <ScrollArea className="h-[500px] w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pr-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {job.customer?.user?.firstName ? `${job.customer.user.firstName} ${job.customer.user.lastName || ''}` : 'Customer'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(job.status)}
                          <Badge variant="outline">
                            {getServiceTypeLabel(job.servicePlanId)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${(job.potentialEarnings / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Potential Earnings</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {job.customer?.address?.street}
                        </div>
                        <div className="text-sm text-gray-600">
                          {job.customer?.address?.city}, {job.customer?.address?.state} {job.customer?.address?.zipCode}
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <span className="font-medium">Preferred:</span> {formatDate(job.scheduledDate)}
                      </span>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Customer Details</div>
                        <div className="text-gray-600 mt-1">
                          <div>Phone: {job.customer?.phone || 'Not provided'}</div>
                          {job.customer?.gateCode && (
                            <div>Gate Code: {job.customer.gateCode}</div>
                          )}
                          {job.customer?.serviceDay && (
                            <div>Preferred Day: {job.customer.serviceDay}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => claimJob(job.id)}
                        className="flex-1"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Claim This Job
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/employee/dashboard/jobs/${job.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
