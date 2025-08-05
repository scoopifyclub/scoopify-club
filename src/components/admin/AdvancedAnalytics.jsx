// Advanced Analytics Component
// For admin dashboard - business intelligence, revenue metrics, customer retention, employee performance
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target, BarChart3, PieChart, Activity, Award, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard, ProgressBar, ActivityFeed } from '@/components/ui/data-visualization';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const AdvancedAnalytics = ({
  onDataExport,
  onReportGenerate,
  className,
  ...props
}) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockAnalyticsData = {
    overview: {
      totalRevenue: 15420.50,
      revenueGrowth: 12.5,
      activeCustomers: 342,
      customerGrowth: 8.2,
      totalServices: 1247,
      serviceGrowth: 15.3,
      averageRating: 4.8,
      ratingChange: 0.2
    },
    revenue: {
      monthly: [12500, 13200, 14100, 15420],
      byService: [
        { name: 'Weekly Service', value: 12000, percentage: 78 },
        { name: 'One-time Cleanup', value: 2200, percentage: 14 },
        { name: 'Add-ons', value: 1220, percentage: 8 }
      ],
      growth: {
        mtd: 12.5,
        qtd: 18.3,
        ytd: 45.2
      }
    },
    customers: {
      retention: {
        rate: 87.5,
        trend: 2.1,
        segments: [
          { name: 'New (0-3 months)', count: 45, percentage: 13 },
          { name: 'Established (3-12 months)', count: 156, percentage: 46 },
          { name: 'Loyal (1+ years)', count: 141, percentage: 41 }
        ]
      },
      acquisition: {
        sources: [
          { name: 'Referrals', count: 89, percentage: 26 },
          { name: 'Online Search', count: 78, percentage: 23 },
          { name: 'Social Media', count: 67, percentage: 20 },
          { name: 'Direct', count: 45, percentage: 13 },
          { name: 'Other', count: 63, percentage: 18 }
        ],
        cost: 45.20
      }
    },
    employees: {
      performance: [
        {
          id: '1',
          name: 'John Smith',
          servicesCompleted: 156,
          averageRating: 4.9,
          efficiency: 94.2,
          earnings: 3240.50,
          status: 'active'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          servicesCompleted: 142,
          averageRating: 4.7,
          efficiency: 91.8,
          earnings: 2980.25,
          status: 'active'
        },
        {
          id: '3',
          name: 'Mike Wilson',
          servicesCompleted: 128,
          averageRating: 4.6,
          efficiency: 89.5,
          earnings: 2680.75,
          status: 'active'
        }
      ],
      metrics: {
        averageEfficiency: 91.8,
        averageRating: 4.7,
        totalEarnings: 8901.50,
        activeEmployees: 3
      }
    },
    operations: {
      coverage: {
        totalAreas: 12,
        coveredAreas: 10,
        coverageRate: 83.3
      },
      scheduling: {
        efficiency: 92.5,
        conflicts: 3,
        optimization: 8.7
      }
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockAnalyticsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      await onDataExport?.(type, timeRange);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleReportGenerate = async (reportType) => {
    try {
      await onReportGenerate?.(reportType, timeRange);
    } catch (err) {
      console.error('Report generation failed:', err);
    }
  };

  const getGrowthColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${analyticsData.overview.totalRevenue.toLocaleString()}`}
          change={analyticsData.overview.revenueGrowth}
          icon={<DollarSign className="w-4 h-4" />}
          trend="up"
        />
        <StatCard
          title="Active Customers"
          value={analyticsData.overview.activeCustomers}
          change={analyticsData.overview.customerGrowth}
          icon={<Users className="w-4 h-4" />}
          trend="up"
        />
        <StatCard
          title="Services Completed"
          value={analyticsData.overview.totalServices}
          change={analyticsData.overview.serviceGrowth}
          icon={<Calendar className="w-4 h-4" />}
          trend="up"
        />
        <StatCard
          title="Average Rating"
          value={analyticsData.overview.averageRating}
          change={analyticsData.overview.ratingChange}
          icon={<Award className="w-4 h-4" />}
          trend="up"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue over the last 4 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.revenue.monthly.map((value, index) => (
              <div key={index} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(value / 16000) * 100}%` }}>
                <div className="text-xs text-center text-white mt-1">
                  ${(value / 1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <Button onClick={() => handleExport('revenue')} variant="outline">
          Export Revenue Data
        </Button>
        <Button onClick={() => handleReportGenerate('monthly')} variant="outline">
          Generate Monthly Report
        </Button>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-6">
      {/* Revenue Growth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MTD Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getGrowthIcon(analyticsData.revenue.growth.mtd)}
              <span className={cn("text-2xl font-bold", getGrowthColor(analyticsData.revenue.growth.mtd))}>
                {analyticsData.revenue.growth.mtd}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">QTD Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getGrowthIcon(analyticsData.revenue.growth.qtd)}
              <span className={cn("text-2xl font-bold", getGrowthColor(analyticsData.revenue.growth.qtd))}>
                {analyticsData.revenue.growth.qtd}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">YTD Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getGrowthIcon(analyticsData.revenue.growth.ytd)}
              <span className={cn("text-2xl font-bold", getGrowthColor(analyticsData.revenue.growth.ytd))}>
                {analyticsData.revenue.growth.ytd}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Service Type */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.revenue.byService.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">${service.value.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">{service.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      {/* Customer Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Retention</CardTitle>
          <CardDescription>Customer retention rate and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-green-600">{analyticsData.customers.retention.rate}%</div>
              <div className="text-sm text-gray-600">Retention Rate</div>
              <div className="flex items-center space-x-2 mt-2">
                {getGrowthIcon(analyticsData.customers.retention.trend)}
                <span className={cn("text-sm", getGrowthColor(analyticsData.customers.retention.trend))}>
                  {analyticsData.customers.retention.trend}% from last month
                </span>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                {analyticsData.customers.retention.segments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{segment.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{segment.count}</span>
                      <span className="text-xs text-gray-500">({segment.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Acquisition */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition</CardTitle>
          <CardDescription>New customer sources and costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.customers.acquisition.sources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{source.name}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">{source.count} customers</span>
                  <span className="text-sm text-gray-500">{source.percentage}%</span>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Average Acquisition Cost</span>
                <span className="text-lg font-bold">${analyticsData.customers.acquisition.cost}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6">
      {/* Employee Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analyticsData.employees.metrics.averageEfficiency}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analyticsData.employees.metrics.averageRating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${analyticsData.employees.metrics.totalEarnings.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analyticsData.employees.metrics.activeEmployees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.employees.performance.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-gray-600">ID: {employee.id}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="font-medium">{employee.servicesCompleted}</div>
                    <div className="text-xs text-gray-600">Services</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{employee.averageRating}</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{employee.efficiency}%</div>
                    <div className="text-xs text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">${employee.earnings.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Earnings</div>
                  </div>
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                    {employee.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error loading analytics: {error}</div>
        <Button onClick={loadAnalyticsData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-600">Business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleExport('all')} variant="outline">
            Export All Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {renderRevenue()}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {renderCustomers()}
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {renderEmployees()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics; 