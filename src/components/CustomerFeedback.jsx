// Customer Feedback and Ratings Component
// For service evaluation and customer satisfaction tracking
import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, Edit, Trash2, Filter, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { StatCard, ProgressBar, ActivityFeed } from '@/components/ui/data-visualization';
import { cn } from '@/lib/utils';

const CustomerFeedback = ({
  serviceId,
  customerId,
  onFeedbackSubmit,
  onFeedbackUpdate,
  onFeedbackDelete,
  className,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    rating: 'all',
    dateRange: 'all',
    serviceType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Form state
  const [formData, setFormData] = useState({
    rating: 0,
    overallSatisfaction: 0,
    serviceQuality: 0,
    communication: 0,
    timeliness: 0,
    valueForMoney: 0,
    writtenFeedback: '',
    recommendToOthers: null,
    serviceAreas: [],
    improvements: ''
  });

  // Mock data for demonstration
  const mockFeedback = [
    {
      id: 1,
      serviceId: 'service_123',
      customerId: 'customer_456',
      rating: 5,
      overallSatisfaction: 5,
      serviceQuality: 5,
      communication: 4,
      timeliness: 5,
      valueForMoney: 5,
      writtenFeedback: 'Excellent service! The yard looks amazing after cleanup. Very professional and thorough.',
      recommendToOthers: true,
      serviceAreas: ['yard_cleanup', 'sanitizer'],
      improvements: '',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      customerName: 'John Smith',
      serviceDate: '2024-01-15',
      serviceType: 'Premium Weekly Service'
    },
    {
      id: 2,
      serviceId: 'service_124',
      customerId: 'customer_457',
      rating: 4,
      overallSatisfaction: 4,
      serviceQuality: 4,
      communication: 5,
      timeliness: 4,
      valueForMoney: 4,
      writtenFeedback: 'Good service overall. Would appreciate more communication about arrival times.',
      recommendToOthers: true,
      serviceAreas: ['yard_cleanup'],
      improvements: 'Better arrival time communication',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T14:20:00Z',
      customerName: 'Sarah Johnson',
      serviceDate: '2024-01-14',
      serviceType: 'Basic Weekly Service'
    }
  ];

  useEffect(() => {
    // Load feedback data
    setFeedback(mockFeedback);
    setLoading(false);
  }, [serviceId, customerId]);

  const handleRatingChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async () => {
    if (formData.rating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    try {
      const feedbackData = {
        ...formData,
        serviceId,
        customerId,
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        const result = await response.json();
        setFeedback(prev => [result, ...prev]);
        setFormData({
          rating: 0,
          overallSatisfaction: 0,
          serviceQuality: 0,
          communication: 0,
          timeliness: 0,
          valueForMoney: 0,
          writtenFeedback: '',
          recommendToOthers: null,
          serviceAreas: [],
          improvements: ''
        });
        setShowForm(false);
        onFeedbackSubmit?.(result);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (feedbackId, updates) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const result = await response.json();
        setFeedback(prev => prev.map(f => f.id === feedbackId ? result : f));
        onFeedbackUpdate?.(result);
      } else {
        throw new Error('Failed to update feedback');
      }
    } catch (error) {
      console.error('Feedback update error:', error);
      alert('Failed to update feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFeedback(prev => prev.filter(f => f.id !== feedbackId));
        onFeedbackDelete?.(feedbackId);
      } else {
        throw new Error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Feedback deletion error:', error);
      alert('Failed to delete feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedback = feedback.filter(f => {
    const matchesRating = filters.rating === 'all' || f.rating === parseInt(filters.rating);
    const matchesServiceType = filters.serviceType === 'all' || f.serviceType === filters.serviceType;
    const matchesSearch = f.writtenFeedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesServiceType && matchesSearch;
  });

  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
    : 0;

  const ratingDistribution = {
    5: feedback.filter(f => f.rating === 5).length,
    4: feedback.filter(f => f.rating === 4).length,
    3: feedback.filter(f => f.rating === 3).length,
    2: feedback.filter(f => f.rating === 2).length,
    1: feedback.filter(f => f.rating === 1).length
  };

  const renderStarRating = (rating, onChange, size = 'md') => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <div className="flex space-x-1">
        {stars.map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={cn(
              "transition-colors",
              size === 'sm' ? "w-4 h-4" : "w-5 h-5",
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            )}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    );
  };

  const renderFeedbackForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Service</CardTitle>
        <CardDescription>
          Help us improve by providing feedback about your recent service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div>
          <Label className="text-base font-medium">Overall Rating *</Label>
          <div className="mt-2">
            {renderStarRating(formData.rating, (value) => handleRatingChange('rating', value))}
          </div>
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Service Quality</Label>
            {renderStarRating(formData.serviceQuality, (value) => handleRatingChange('serviceQuality', value), 'sm')}
          </div>
          <div>
            <Label>Communication</Label>
            {renderStarRating(formData.communication, (value) => handleRatingChange('communication', value), 'sm')}
          </div>
          <div>
            <Label>Timeliness</Label>
            {renderStarRating(formData.timeliness, (value) => handleRatingChange('timeliness', value), 'sm')}
          </div>
          <div>
            <Label>Value for Money</Label>
            {renderStarRating(formData.valueForMoney, (value) => handleRatingChange('valueForMoney', value), 'sm')}
          </div>
        </div>

        {/* Written Feedback */}
        <div>
          <Label>Additional Comments</Label>
          <Textarea
            value={formData.writtenFeedback}
            onChange={(e) => handleRatingChange('writtenFeedback', e.target.value)}
            placeholder="Tell us about your experience..."
            rows={4}
          />
        </div>

        {/* Recommend to Others */}
        <div>
          <Label>Would you recommend our service to others?</Label>
          <div className="flex space-x-4 mt-2">
            <Button
              variant={formData.recommendToOthers === true ? 'default' : 'outline'}
              onClick={() => handleRatingChange('recommendToOthers', true)}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes
            </Button>
            <Button
              variant={formData.recommendToOthers === false ? 'default' : 'outline'}
              onClick={() => handleRatingChange('recommendToOthers', false)}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No
            </Button>
          </div>
        </div>

        {/* Improvements */}
        <div>
          <Label>How can we improve?</Label>
          <Textarea
            value={formData.improvements}
            onChange={(e) => handleRatingChange('improvements', e.target.value)}
            placeholder="Suggestions for improvement..."
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-2">
          <Button onClick={handleSubmit} disabled={submitting || formData.rating === 0}>
            {submitting ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Feedback
          </Button>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFeedbackList = () => (
    <div className="space-y-4">
      {filteredFeedback.map((f) => (
        <Card key={f.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium">{f.customerName}</h4>
                  <Badge variant="outline">{f.serviceType}</Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(f.serviceDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                  {renderStarRating(f.rating, null, 'sm')}
                  <span className="text-sm font-medium">{f.rating}/5</span>
                  {f.recommendToOthers !== null && (
                    <Badge variant={f.recommendToOthers ? 'default' : 'secondary'}>
                      {f.recommendToOthers ? 'Would Recommend' : 'Would Not Recommend'}
                    </Badge>
                  )}
                </div>

                {f.writtenFeedback && (
                  <p className="text-gray-700 mb-3">{f.writtenFeedback}</p>
                )}

                {f.improvements && (
                  <div className="mb-3">
                    <Label className="text-sm font-medium text-gray-600">Improvements:</Label>
                    <p className="text-sm text-gray-600">{f.improvements}</p>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Service Quality: {f.serviceQuality}/5</span>
                  <span>Communication: {f.communication}/5</span>
                  <span>Timeliness: {f.timeliness}/5</span>
                  <span>Value: {f.valueForMoney}/5</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentFeedback(f);
                    setFormData({
                      rating: f.rating,
                      overallSatisfaction: f.overallSatisfaction,
                      serviceQuality: f.serviceQuality,
                      communication: f.communication,
                      timeliness: f.timeliness,
                      valueForMoney: f.valueForMoney,
                      writtenFeedback: f.writtenFeedback,
                      recommendToOthers: f.recommendToOthers,
                      serviceAreas: f.serviceAreas,
                      improvements: f.improvements
                    });
                    setShowForm(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(f.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Average Rating"
          value={averageRating.toFixed(1)}
          subtitle="out of 5 stars"
          icon="star"
          trend="+0.2"
          trendDirection="up"
        />
        <StatCard
          title="Total Reviews"
          value={feedback.length}
          subtitle="customer feedback"
          icon="message-square"
        />
        <StatCard
          title="Recommendation Rate"
          value={`${feedback.filter(f => f.recommendToOthers).length / Math.max(feedback.length, 1) * 100}%`}
          subtitle="would recommend"
          icon="thumbs-up"
        />
        <StatCard
          title="Response Rate"
          value="95%"
          subtitle="feedback responded to"
          icon="send"
        />
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingDistribution[rating];
              const percentage = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <ProgressBar
                    value={percentage}
                    className="flex-1"
                    color={rating >= 4 ? 'green' : rating >= 3 ? 'yellow' : 'red'}
                  />
                  <span className="text-sm text-gray-600 w-12">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={feedback.slice(0, 5).map(f => ({
              id: f.id,
              title: `${f.customerName} rated service ${f.rating}/5`,
              description: f.writtenFeedback || 'No written feedback provided',
              timestamp: f.createdAt,
              icon: 'star',
              color: f.rating >= 4 ? 'green' : f.rating >= 3 ? 'yellow' : 'red'
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <LoadingOverlay isLoading={submitting} message="Submitting feedback...">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Customer Feedback</h2>
              <p className="text-gray-600">
                Service ratings and customer satisfaction
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Feedback
            </Button>
          </div>

          {/* Feedback Form */}
          {showForm && renderFeedbackForm()}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="feedback">All Feedback</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search feedback..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}>
                      <SelectTrigger className="w-full md:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.serviceType} onValueChange={(value) => setFilters(prev => ({ ...prev, serviceType: value }))}>
                      <SelectTrigger className="w-full md:w-40">
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
                </CardContent>
              </Card>

              {/* Feedback List */}
              {renderFeedbackList()}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Analytics</CardTitle>
                  <CardDescription>Customer satisfaction insights and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Rating Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Rating Distribution</h4>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = feedback.filter(f => f.rating === rating).length;
                            const percentage = feedback.length > 0 ? (count / feedback.length * 100).toFixed(1) : 0;
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                  <span className="text-sm font-medium">{rating}</span>
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-400 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Overall Satisfaction</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : '0.0'}
                          </div>
                          <div className="text-sm text-gray-600">Average Rating</div>
                          <div className="text-2xl text-gray-400 mt-2">
                            {feedback.length > 0 && feedback.filter(f => f.rating >= 4).length / feedback.length * 100 > 80 ? '😊' : 
                             feedback.length > 0 && feedback.filter(f => f.rating >= 4).length / feedback.length * 100 > 60 ? '😐' : '😞'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Service Type Analysis */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Service Type Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Basic Weekly Service', 'Premium Weekly Service', 'Deluxe Weekly Service'].map(serviceType => {
                          const serviceFeedback = feedback.filter(f => f.serviceType === serviceType);
                          const avgRating = serviceFeedback.length > 0 
                            ? (serviceFeedback.reduce((sum, f) => sum + f.rating, 0) / serviceFeedback.length).toFixed(1)
                            : '0.0';
                          return (
                            <div key={serviceType} className="bg-gray-50 p-4 rounded-lg text-center">
                              <div className="text-lg font-semibold text-gray-800 mb-2">
                                {serviceType.replace(' Weekly Service', '')}
                              </div>
                              <div className="text-2xl font-bold text-blue-600 mb-1">{avgRating}</div>
                              <div className="text-sm text-gray-600">Avg Rating</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {serviceFeedback.length} reviews
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Recent Trends */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Recent Trends</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700">
                          <TrendingUp className="h-5 w-5" />
                          <span className="font-medium">Trending Up</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-2">
                          Customer satisfaction has improved by 15% over the last 30 days. 
                          Most customers appreciate the consistent service quality and communication.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default CustomerFeedback; 