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
  const [sortBy, setSortBy] = useState('earnings'); // New: sorting options
  const [claimingJob, setClaimingJob] = useState(null); // New: track which job is being claimed

  useEffect(() => {
    fetchAvailableJobs();
  }, [employeeId]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, selectedServiceType, selectedStatus, sortBy]);

  const sortJobs = (jobsToSort) => {
    switch (sortBy) {
      case 'earnings':
        return jobsToSort.sort((a, b) => b.potentialEarnings - a.potentialEarnings);
      case 'date':
        return jobsToSort.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      case 'distance':
        // Simple distance calculation (could be enhanced with real coordinates)
        return jobsToSort.sort((a, b) => {
          const zipA = parseInt(a.customer?.address?.zipCode || '0');
          const zipB = parseInt(b.customer?.address?.zipCode || '0');
          return Math.abs(zipA - 80831) - Math.abs(zipB - 80831); // Distance from Peyton, CO
        });
      case 'urgency':
        // Prioritize jobs scheduled for today/tomorrow
        return jobsToSort.sort((a, b) => {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const dateA = new Date(a.scheduledDate);
          const dateB = new Date(b.scheduledDate);
          
          const isUrgentA = dateA.toDateString() === today.toDateString() || dateA.toDateString() === tomorrow.toDateString();
          const isUrgentB = dateB.toDateString() === today.toDateString() || dateB.toDateString() === tomorrow.toDateString();
          
          if (isUrgentA && !isUrgentB) return -1;
          if (!isUrgentA && isUrgentB) return 1;
          return 0;
        });
      default:
        return jobsToSort;
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

    // Sort the filtered jobs
    filtered = sortJobs(filtered);

    setFilteredJobs(filtered);
  };

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

  const claimJob = async (jobId) => {
    try {
      setClaimingJob(jobId);
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
    } finally {
      setClaimingJob(null);
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
                <option value="monthly-1">Monthly (1 Dog)</option>
                <option value="monthly-2">Monthly (2 Dogs)</option>
                <option value="monthly-3">Monthly (3+ Dogs)</option>
                <option value="initial-cleanup">Initial Cleanup</option>
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
                <option value="SCHEDULED">Scheduled</option>
                <option value="AVAILABLE">Available</option>
              </select>
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sort by:</Label>
              <div className="flex space-x-2">
                <Button
                  variant={sortBy === 'earnings' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('earnings')}
                  className="text-xs"
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Highest Pay
                </Button>
                <Button
                  variant={sortBy === 'urgency' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('urgency')}
                  className="text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Urgency
                </Button>
                <Button
                  variant={sortBy === 'distance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('distance')}
                  className="text-xs"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Distance
                </Button>
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('date')}
                  className="text-xs"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Date
                </Button>
              </div>
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
              {filteredJobs.map((job) => {
                const isUrgent = (() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const jobDate = new Date(job.scheduledDate);
                  return jobDate.toDateString() === today.toDateString() || jobDate.toDateString() === tomorrow.toDateString();
                })();
                
                const isHighEarnings = job.potentialEarnings > 15; // Highlight high-paying jobs
                
                return (
                  <Card key={job.id} className={`hover:shadow-lg transition-all duration-200 border ${
                    isUrgent ? 'ring-2 ring-orange-200 bg-orange-50' : ''
                  } ${isHighEarnings ? 'border-green-300' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {job.customer?.user?.firstName ? `${job.customer.user.firstName} ${job.customer.user.lastName || ''}` : 'Customer'}
                            {isUrgent && (
                              <Badge variant="destructive" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                            {isHighEarnings && (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                <DollarSign className="w-3 h-3 mr-1" />
                                High Pay
                              </Badge>
                            )}
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
                            ${(job.potentialEarnings).toFixed(2)}
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
                        disabled={claimingJob === job.id}
                      >
                        {claimingJob === job.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Claim This Job
                          </>
                        )}
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
              );
            })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
