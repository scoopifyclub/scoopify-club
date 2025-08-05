'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react';

export default function AutomationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState({
    employeeRecruitment: { status: 'running', lastRun: '2 hours ago', success: true },
    customerAcquisition: { status: 'running', lastRun: '1 hour ago', success: true },
    businessIntelligence: { status: 'idle', lastRun: '6 hours ago', success: true }
  });
  const [metrics, setMetrics] = useState({
    weeklyRevenue: 0,
    activeCustomers: 0,
    activeEmployees: 0,
    automationSuccess: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch system status
      const statusResponse = await fetch('/api/admin/automation-status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData.systems || systemStatus);
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/admin/system-metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics || metrics);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/recent-activity?limit=10');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutomation = async (automationType) => {
    try {
      const response = await fetch('/api/admin/trigger-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ automationType }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`${automationType} triggered successfully:`, result);
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        console.error(`Failed to trigger ${automationType}`);
      }
    } catch (error) {
      console.error(`Error triggering ${automationType}:`, error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>;
      case 'idle':
        return <Badge variant="secondary">Idle</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="automation">Automation Systems</TabsTrigger>
          <TabsTrigger value="analytics">Business Analytics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.weeklyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
                <p className="text-xs text-muted-foreground">+5 new this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeEmployees}</div>
                <p className="text-xs text-muted-foreground">+2 new this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automation Success</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.automationSuccess}%</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.employeeRecruitment.status)}
                  Employee Recruitment
                </CardTitle>
                <CardDescription>Automated employee hiring system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  {getStatusBadge(systemStatus.employeeRecruitment.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Run:</span>
                  <span className="text-sm text-muted-foreground">{systemStatus.employeeRecruitment.lastRun}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => triggerAutomation('employee-recruitment')}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.customerAcquisition.status)}
                  Customer Acquisition
                </CardTitle>
                <CardDescription>Automated customer marketing system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  {getStatusBadge(systemStatus.customerAcquisition.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Run:</span>
                  <span className="text-sm text-muted-foreground">{systemStatus.customerAcquisition.lastRun}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => triggerAutomation('customer-acquisition')}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.businessIntelligence.status)}
                  Business Intelligence
                </CardTitle>
                <CardDescription>Automated reporting and analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  {getStatusBadge(systemStatus.businessIntelligence.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Run:</span>
                  <span className="text-sm text-muted-foreground">{systemStatus.businessIntelligence.lastRun}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => triggerAutomation('business-intelligence')}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation System Controls</CardTitle>
              <CardDescription>Manually trigger automation processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Employee Recruitment</h4>
                  <p className="text-sm text-muted-foreground">Analyze coverage gaps and post job openings</p>
                  <Button 
                    onClick={() => triggerAutomation('employee-recruitment')}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Trigger Recruitment
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Customer Acquisition</h4>
                  <p className="text-sm text-muted-foreground">Send marketing campaigns and follow up with leads</p>
                  <Button 
                    onClick={() => triggerAutomation('customer-acquisition')}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Trigger Acquisition
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Business Intelligence</h4>
                  <p className="text-sm text-muted-foreground">Generate reports and analyze business metrics</p>
                  <Button 
                    onClick={() => triggerAutomation('business-intelligence')}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => triggerAutomation('all')}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Trigger All Systems
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Analytics</CardTitle>
              <CardDescription>Key performance indicators and growth metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Revenue Growth</h4>
                  <div className="text-2xl font-bold text-green-600">+24.5%</div>
                  <p className="text-sm text-muted-foreground">Compared to last month</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Customer Retention</h4>
                  <div className="text-2xl font-bold text-blue-600">94.2%</div>
                  <p className="text-sm text-muted-foreground">Monthly retention rate</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Service Coverage</h4>
                  <div className="text-2xl font-bold text-purple-600">87.3%</div>
                  <p className="text-sm text-muted-foreground">Areas with active employees</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Automation Efficiency</h4>
                  <div className="text-2xl font-bold text-orange-600">96.8%</div>
                  <p className="text-sm text-muted-foreground">Successful automation runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest automation activities and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'AUTOMATION_TRIGGER' && <Play className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'ERROR' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {activity.type === 'INFO' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <div>
                          <p className="font-medium">{activity.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{activity.type}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent activity</p>
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