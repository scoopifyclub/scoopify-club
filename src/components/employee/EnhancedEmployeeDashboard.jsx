// Enhanced Employee Dashboard Component
// For employee dashboard improvements - earnings tracking, performance metrics, training tracking, communication tools
import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, DollarSign, Users, Star, Calendar, MessageCircle, BookOpen, Target, Zap, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard, ProgressBar, ActivityFeed } from '@/components/ui/data-visualization';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const EnhancedEmployeeDashboard = ({
  employeeId,
  onEarningsUpdate,
  onPerformanceUpdate,
  onTrainingComplete,
  className,
  ...props
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockDashboardData = {
    earnings: {
      currentWeek: 245.50,
      lastWeek: 198.75,
      currentMonth: 892.30,
      lastMonth: 756.45,
      totalEarned: 3245.80,
      pendingPayout: 156.25,
      averagePerService: 22.50,
      servicesThisWeek: 11,
      servicesLastWeek: 9,
      growthRate: 22.3
    },
    performance: {
      rating: 4.8,
      totalReviews: 47,
      completionRate: 96.5,
      onTimeRate: 94.2,
      customerSatisfaction: 4.7,
      efficiencyScore: 88.5,
      qualityScore: 92.1,
      communicationScore: 4.6,
      thisWeek: {
        services: 11,
        hours: 8.5,
        efficiency: 89.2,
        quality: 93.1
      },
      lastWeek: {
        services: 9,
        hours: 7.2,
        efficiency: 87.8,
        quality: 91.5
      }
    },
    training: {
      completedCourses: 8,
      totalCourses: 12,
      certifications: [
        { id: 1, name: 'Safety Training', status: 'completed', date: '2024-01-10', expires: '2025-01-10' },
        { id: 2, name: 'Customer Service', status: 'completed', date: '2024-01-05', expires: '2025-01-05' },
        { id: 3, name: 'Equipment Operation', status: 'in_progress', progress: 75, dueDate: '2024-01-20' },
        { id: 4, name: 'Advanced Techniques', status: 'not_started', dueDate: '2024-02-15' }
      ],
      upcomingTraining: [
        { id: 5, name: 'New Equipment Training', date: '2024-01-25', duration: '2 hours' },
        { id: 6, name: 'Seasonal Safety Update', date: '2024-02-01', duration: '1 hour' }
      ],
      progress: 66.7
    },
    communication: {
      unreadMessages: 3,
      recentMessages: [
        { id: 1, from: 'Manager', subject: 'Weekly Schedule Update', time: '2 hours ago', read: false },
        { id: 2, from: 'Customer Support', subject: 'Service Feedback', time: '1 day ago', read: false },
        { id: 3, from: 'Training Team', subject: 'New Course Available', time: '2 days ago', read: false }
      ],
      announcements: [
        { id: 1, title: 'New Safety Protocol', content: 'Updated safety guidelines effective immediately', priority: 'high' },
        { id: 2, title: 'Equipment Maintenance', content: 'Scheduled maintenance this Friday', priority: 'medium' }
      ]
    },
    goals: {
      weekly: {
        services: { target: 15, current: 11, progress: 73.3 },
        earnings: { target: 300, current: 245.50, progress: 81.8 },
        rating: { target: 4.8, current: 4.8, progress: 100 }
      },
      monthly: {
        services: { target: 60, current: 42, progress: 70 },
        earnings: { target: 1200, current: 892.30, progress: 74.4 },
        rating: { target: 4.7, current: 4.8, progress: 100 }
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [employeeId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboardData(mockDashboardData);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getCertificationStatus = (status) => {
    const statusConfig = {
      completed: { variant: 'default', text: 'Completed' },
      in_progress: { variant: 'secondary', text: 'In Progress' },
      not_started: { variant: 'outline', text: 'Not Started' },
      expired: { variant: 'destructive', text: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.not_started;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { variant: 'destructive', text: 'High' },
      medium: { variant: 'secondary', text: 'Medium' },
      low: { variant: 'outline', text: 'Low' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="This Week's Earnings"
          value={`$${dashboardData.earnings.currentWeek.toFixed(2)}`}
          change={`+${dashboardData.earnings.growthRate}%`}
          changeType="positive"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Services Completed"
          value={dashboardData.earnings.servicesThisWeek}
          change={`+${dashboardData.earnings.servicesThisWeek - dashboardData.earnings.servicesLastWeek}`}
          changeType="positive"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Average Rating"
          value={dashboardData.performance.rating.toFixed(1)}
          change={`${dashboardData.performance.totalReviews} reviews`}
          changeType="neutral"
          icon={<Star className="h-4 w-4" />}
        />
        <StatCard
          title="Training Progress"
          value={`${dashboardData.training.progress.toFixed(1)}%`}
          change={`${dashboardData.training.completedCourses}/${dashboardData.training.totalCourses} courses`}
          changeType="neutral"
          icon={<BookOpen className="h-4 w-4" />}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm font-semibold">{dashboardData.performance.completionRate}%</span>
              </div>
              <Progress value={dashboardData.performance.completionRate} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">On-Time Rate</span>
                <span className="text-sm font-semibold">{dashboardData.performance.onTimeRate}%</span>
              </div>
              <Progress value={dashboardData.performance.onTimeRate} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Efficiency Score</span>
                <span className="text-sm font-semibold">{dashboardData.performance.efficiencyScore}%</span>
              </div>
              <Progress value={dashboardData.performance.efficiencyScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Services Target</span>
                <span className="text-sm font-semibold">{dashboardData.goals.weekly.services.current}/{dashboardData.goals.weekly.services.target}</span>
              </div>
              <Progress value={dashboardData.goals.weekly.services.progress} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Earnings Target</span>
                <span className="text-sm font-semibold">${dashboardData.goals.weekly.earnings.current}/${dashboardData.goals.weekly.earnings.target}</span>
              </div>
              <Progress value={dashboardData.goals.weekly.earnings.progress} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rating Target</span>
                <span className="text-sm font-semibold">{dashboardData.goals.weekly.rating.current}/{dashboardData.goals.weekly.rating.target}</span>
              </div>
              <Progress value={dashboardData.goals.weekly.rating.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${dashboardData.earnings.currentWeek.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">
              {dashboardData.earnings.servicesThisWeek} services completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">${dashboardData.earnings.currentMonth.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(dashboardData.earnings.currentMonth / dashboardData.earnings.averagePerService)} services completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">${dashboardData.earnings.pendingPayout.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Trend</CardTitle>
          <CardDescription>Your earnings over the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Earnings chart will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Details */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Average per Service</p>
                <p className="text-sm text-gray-600">Based on completed services</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${dashboardData.earnings.averagePerService}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Total Earned</p>
                <p className="text-sm text-gray-600">All time earnings</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${dashboardData.earnings.totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6">
      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{dashboardData.training.progress.toFixed(1)}%</span>
            </div>
            <Progress value={dashboardData.training.progress} className="h-3" />
            <p className="text-sm text-gray-600">
              {dashboardData.training.completedCourses} of {dashboardData.training.totalCourses} courses completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications & Training</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.training.certifications.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{cert.name}</h4>
                    {getCertificationStatus(cert.status)}
                  </div>
                  {cert.status === 'completed' && (
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(cert.date).toLocaleDateString()} • 
                      Expires: {new Date(cert.expires).toLocaleDateString()}
                    </p>
                  )}
                  {cert.status === 'in_progress' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-semibold">{cert.progress}%</span>
                      </div>
                      <Progress value={cert.progress} className="h-2" />
                      <p className="text-sm text-gray-600">Due: {new Date(cert.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {cert.status === 'not_started' && (
                    <p className="text-sm text-gray-600">Due: {new Date(cert.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
                {cert.status === 'not_started' && (
                  <Button size="sm">Start</Button>
                )}
                {cert.status === 'in_progress' && (
                  <Button size="sm">Continue</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Training */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Training</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.training.upcomingTraining.map((training) => (
              <div key={training.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{training.name}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(training.date).toLocaleDateString()} • {training.duration}
                  </p>
                </div>
                <Button size="sm" variant="outline">View Details</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-6">
      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages ({dashboardData.communication.unreadMessages} unread)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.communication.recentMessages.map((message) => (
              <div key={message.id} className={`flex items-center justify-between p-3 border rounded-lg ${!message.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{message.subject}</h4>
                    {!message.read && <Badge variant="default" className="text-xs">New</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">From: {message.from}</p>
                  <p className="text-sm text-gray-500">{message.time}</p>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.communication.announcements.map((announcement) => (
              <div key={announcement.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{announcement.title}</h4>
                  {getPriorityBadge(announcement.priority)}
                </div>
                <p className="text-sm text-gray-600">{announcement.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading enhanced dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadDashboardData} className="mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Dashboard</h2>
          <p className="text-gray-600">Track your performance, earnings, and training</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Enhanced
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          {renderEarnings()}
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          {renderTraining()}
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          {renderCommunication()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedEmployeeDashboard; 