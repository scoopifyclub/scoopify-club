'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Mail,
  Calendar,
  MapPin,
  Star,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationDashboard() {
  const [automationStatus, setAutomationStatus] = useState({});
  const [systemMetrics, setSystemMetrics] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomationData();
    const interval = setInterval(loadAutomationData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      
      // Load automation status
      const statusResponse = await fetch('/api/admin/automation-status');
      const statusData = await statusResponse.json();
      setAutomationStatus(statusData);

      // Load system metrics
      const metricsResponse = await fetch('/api/admin/system-metrics');
      const metricsData = await metricsResponse.json();
      setSystemMetrics(metricsData);

      // Load recent activity
      const activityResponse = await fetch('/api/admin/recent-activity');
      const activityData = await activityResponse.json();
      setRecentActivity(activityData);

    } catch (error) {
      console.error('Error loading automation data:', error);
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutomation = async (automationType) => {
    try {
      const response = await fetch(`/api/admin/trigger-automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: automationType })
      });

      if (response.ok) {
        toast.success(`${automationType} automation triggered successfully`);
        loadAutomationData(); // Refresh data
      } else {
        toast.error('Failed to trigger automation');
      }
    } catch (error) {
      console.error('Error triggering automation:', error);
      toast.error('Failed to trigger automation');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PAUSED': return 'bg-yellow-500';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'PAUSED': return <Pause className="w-4 h-4" />;
      case 'ERROR': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 Automation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and control your self-running business systems
          </p>
        </div>
        <Button onClick={loadAutomationData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automation Systems</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStatus.totalSystems || 0}</div>
            <p className="text-xs text-muted-foreground">
              {automationStatus.activeSystems || 0} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${systemMetrics.weeklyRevenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.revenueGrowth > 0 ? '+' : ''}{systemMetrics.revenueGrowth?.toFixed(1) || 0}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.activeCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{systemMetrics.newCustomersThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.systemHealth || 0}%</div>
            <Progress value={systemMetrics.systemHealth || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="automation">Automation Systems</TabsTrigger>
          <TabsTrigger value="analytics">Business Analytics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Automation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(automationStatus.systems || {}).map(([system, status]) => (
                  <div key={system} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`}></div>
                      <div>
                        <p className="font-medium">{system}</p>
                        <p className="text-sm text-muted-foreground">
                          Last run: {status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {status.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => triggerAutomation('customer-acquisition')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Trigger Customer Acquisition
                </Button>
                <Button 
                  onClick={() => triggerAutomation('employee-recruitment')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Trigger Employee Recruitment
                </Button>
                <Button 
                  onClick={() => triggerAutomation('business-intelligence')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Business Report
                </Button>
                <Button 
                  onClick={() => triggerAutomation('customer-notifications')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Customer Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Acquisition Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Customer Acquisition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Leads Identified</span>
                  <span className="font-medium">{systemMetrics.leadsIdentified || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Campaigns Sent</span>
                  <span className="font-medium">{systemMetrics.campaignsSent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Conversions</span>
                  <span className="font-medium">{systemMetrics.conversions || 0}</span>
                </div>
                <Progress 
                  value={systemMetrics.conversionRate || 0} 
                  className="mt-2" 
                />
                <p className="text-sm text-muted-foreground">
                  Conversion Rate: {systemMetrics.conversionRate?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            {/* Employee Recruitment Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Employee Recruitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Job Postings Created</span>
                  <span className="font-medium">{systemMetrics.jobPostingsCreated || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Applications Processed</span>
                  <span className="font-medium">{systemMetrics.applicationsProcessed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Interviews Scheduled</span>
                  <span className="font-medium">{systemMetrics.interviewsScheduled || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Onboarding Initiated</span>
                  <span className="font-medium">{systemMetrics.onboardingInitiated || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Business Intelligence Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Business Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reports Generated</span>
                  <span className="font-medium">{systemMetrics.reportsGenerated || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Risks Identified</span>
                  <span className="font-medium">{systemMetrics.risksIdentified || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recommendations</span>
                  <span className="font-medium">{systemMetrics.recommendationsGenerated || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alerts</span>
                  <span className="font-medium">{systemMetrics.alertsGenerated || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notifications Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Customer Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Service Reminders</span>
                  <span className="font-medium">{systemMetrics.serviceRemindersSent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Follow-ups</span>
                  <span className="font-medium">{systemMetrics.followUpsSent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Satisfaction Surveys</span>
                  <span className="font-medium">{systemMetrics.surveysSent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Reminders</span>
                  <span className="font-medium">{systemMetrics.paymentRemindersSent || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      +{systemMetrics.customerGrowthRate?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Customer Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      +{systemMetrics.revenueGrowth?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Revenue Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {systemMetrics.employeeGrowthRate?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Employee Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {systemMetrics.marketPenetration?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Market Penetration</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Customer Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <Progress value={systemMetrics.customerSatisfaction || 0} className="w-20" />
                      <span className="font-medium">{systemMetrics.customerSatisfaction?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Employee Productivity</span>
                    <div className="flex items-center gap-2">
                      <Progress value={systemMetrics.employeeProductivity || 0} className="w-20" />
                      <span className="font-medium">{systemMetrics.employeeProductivity?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service Completion Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={systemMetrics.serviceCompletionRate || 0} className="w-20" />
                      <span className="font-medium">{systemMetrics.serviceCompletionRate?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment Success Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={systemMetrics.paymentSuccessRate || 0} className="w-20" />
                      <span className="font-medium">{systemMetrics.paymentSuccessRate?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Coverage Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Covered Zip Codes</span>
                    <span className="font-medium">{systemMetrics.coveredZipCodes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer Zip Codes</span>
                    <span className="font-medium">{systemMetrics.customerZipCodes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Coverage Gaps</span>
                    <span className="font-medium text-red-600">{systemMetrics.coverageGaps || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Coverage Rate</span>
                    <span className="font-medium">{systemMetrics.coverageRate?.toFixed(1) || 0}%</span>
                  </div>
                </div>
                {systemMetrics.coverageGaps > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      ⚠️ {systemMetrics.coverageGaps} areas need employee recruitment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Monthly Revenue</span>
                    <span className="font-medium">${systemMetrics.monthlyRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Monthly Expenses</span>
                    <span className="font-medium">${systemMetrics.monthlyExpenses?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Net Profit</span>
                    <span className="font-medium text-green-600">
                      ${systemMetrics.monthlyProfit?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Profit Margin</span>
                    <span className="font-medium">{systemMetrics.profitMargin?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'SUCCESS' ? 'bg-green-500' :
                      activity.type === 'WARNING' ? 'bg-yellow-500' :
                      activity.type === 'ERROR' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 