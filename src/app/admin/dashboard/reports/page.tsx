'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CalendarIcon, Download, ArrowUpIcon, ArrowDownIcon, 
  CircleDollarSign, BarChart3, TrendingUp, Users,
  PieChart, Activity, Clock, MoreHorizontal, HelpCircle
} from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';

interface ReportData {
  revenue: {
    daily: {
      date: string;
      amount: number;
      count: number;
    }[];
    weekly: {
      date: string;
      amount: number;
      count: number;
    }[];
    monthly: {
      date: string;
      amount: number;
      count: number;
    }[];
  };
  services: {
    completed: number;
    scheduled: number;
    cancelled: number;
    totalHours: number;
    byType: {
      name: string;
      count: number;
      revenue: number;
    }[];
    byRegion: {
      name: string;
      count: number;
      revenue: number;
    }[];
  };
  customers: {
    total: number;
    new: number;
    active: number;
    inactive: number;
    retention: number;
    satisfaction: number;
  };
  employees: {
    total: number;
    active: number;
    performance: {
      name: string;
      completionRate: number;
      rating: number;
      revenue: number;
    }[];
  };
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/dashboard');
      return;
    }
    
    // Verify user is an admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch report data
    fetchReportData();
  }, [status, session, router, dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch this data from your API with the date range parameter
      // For now, using mock data
      
      // Generate date ranges
      const today = new Date();
      const dailyData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(today, 29 - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          amount: Math.round(1000 + Math.random() * 500),
          count: Math.round(5 + Math.random() * 15)
        };
      });
      
      const weeklyData = Array.from({ length: 12 }, (_, i) => {
        const date = subDays(today, (11 - i) * 7);
        return {
          date: format(date, 'yyyy-MM-dd'),
          amount: Math.round(6000 + Math.random() * 4000),
          count: Math.round(35 + Math.random() * 25)
        };
      });
      
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(today, 11 - i);
        return {
          date: format(date, 'yyyy-MM'),
          amount: Math.round(25000 + Math.random() * 15000),
          count: Math.round(150 + Math.random() * 100)
        };
      });
      
      setReportData({
        revenue: {
          daily: dailyData,
          weekly: weeklyData,
          monthly: monthlyData
        },
        services: {
          completed: 1247,
          scheduled: 358,
          cancelled: 42,
          totalHours: 3568,
          byType: [
            { name: 'Regular Cleaning', count: 782, revenue: 39100 },
            { name: 'Deep Cleaning', count: 321, revenue: 28890 },
            { name: 'Move-in/Move-out', count: 98, revenue: 14700 },
            { name: 'Special Services', count: 46, revenue: 6900 }
          ],
          byRegion: [
            { name: 'Downtown', count: 412, revenue: 28840 },
            { name: 'North Side', count: 356, revenue: 24920 },
            { name: 'West Hills', count: 298, revenue: 20860 },
            { name: 'East Side', count: 181, revenue: 12670 }
          ]
        },
        customers: {
          total: 412,
          new: 28,
          active: 342,
          inactive: 70,
          retention: 87.4,
          satisfaction: 94.2
        },
        employees: {
          total: 24,
          active: 22,
          performance: [
            { name: 'Sarah Johnson', completionRate: 98.2, rating: 4.9, revenue: 12450 },
            { name: 'David Miller', completionRate: 97.5, rating: 4.8, revenue: 10320 },
            { name: 'Emily Davis', completionRate: 96.8, rating: 4.7, revenue: 9870 },
            { name: 'Tom Wilson', completionRate: 95.2, rating: 4.5, revenue: 7650 },
            { name: 'James Brown', completionRate: 92.1, rating: 4.2, revenue: 5980 }
          ]
        }
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to render a simple bar chart visualization
  const renderBarChart = (data: { name: string; count: number; revenue: number }[], valueKey: 'count' | 'revenue') => {
    const maxValue = Math.max(...data.map(item => item[valueKey]));
    
    return (
      <div className="mt-2">
        {data.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                {valueKey === 'revenue' ? formatCurrency(item[valueKey]) : item[valueKey]}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2" 
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Data Available</h3>
        <p className="text-muted-foreground mb-4">
          We couldn't load the report data at this time.
        </p>
        <Button onClick={fetchReportData}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Business performance metrics and insights
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-[180px]">
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Total earnings and service count trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
              <div className="text-2xl font-bold">
                {formatCurrency(reportData.revenue.daily.reduce((sum, day) => sum + day.amount, 0))}
              </div>
              <div className="flex items-center mt-1 text-xs">
                <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">12.5%</span>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Service Count</div>
              <div className="text-2xl font-bold">
                {reportData.revenue.daily.reduce((sum, day) => sum + day.count, 0)}
              </div>
              <div className="flex items-center mt-1 text-xs">
                <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">8.3%</span>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Average Revenue</div>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  reportData.revenue.daily.reduce((sum, day) => sum + day.amount, 0) / 
                  reportData.revenue.daily.reduce((sum, day) => sum + day.count, 0)
                )}
              </div>
              <div className="flex items-center mt-1 text-xs">
                <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">3.8%</span>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="w-full h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Revenue chart visualization would appear here</p>
              <p className="text-xs text-muted-foreground">Daily revenue for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Service Analysis</CardTitle>
          <CardDescription>Breakdown by service type and region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-lg font-bold">{reportData.services.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-lg font-bold">{reportData.services.scheduled}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-lg font-bold">{reportData.services.cancelled}</div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-lg font-bold">{reportData.services.totalHours}</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
          </div>

          <Tabs defaultValue="byType">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="byType">By Service Type</TabsTrigger>
              <TabsTrigger value="byRegion">By Region</TabsTrigger>
            </TabsList>
            <TabsContent value="byType" className="pt-4">
              {renderBarChart(reportData.services.byType, 'revenue')}
            </TabsContent>
            <TabsContent value="byRegion" className="pt-4">
              {renderBarChart(reportData.services.byRegion, 'revenue')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Metrics</CardTitle>
            <CardDescription>Customer growth and satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center mb-1">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Customers</span>
                </div>
                <div className="text-xl font-bold">{reportData.customers.total}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {reportData.customers.new} new this period
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center mb-1">
                  <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Customer Activity</span>
                </div>
                <div className="text-xl font-bold">{reportData.customers.active}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Active in the last 30 days
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Retention Rate</span>
                  <span className="text-sm">{reportData.customers.retention}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 rounded-full h-2" 
                    style={{ width: `${reportData.customers.retention}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Satisfaction Score</span>
                  <span className="text-sm">{reportData.customers.satisfaction}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 rounded-full h-2" 
                    style={{ width: `${reportData.customers.satisfaction}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
            <CardDescription>Top performing team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-xl font-bold">{reportData.employees.total}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
              <div>
                <div className="text-xl font-bold">{reportData.employees.active}</div>
                <div className="text-sm text-muted-foreground">Active Employees</div>
              </div>
            </div>

            <div className="space-y-4">
              {reportData.employees.performance.map((employee, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="rounded-full bg-muted h-8 w-8 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium">{employee.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{employee.name}</div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CircleDollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(employee.revenue)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <div className="text-xs mr-1 text-muted-foreground">Rating:</div>
                      <div className="text-sm font-medium">{employee.rating}</div>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {employee.completionRate}% completion
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 