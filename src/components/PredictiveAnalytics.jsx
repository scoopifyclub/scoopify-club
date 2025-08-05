'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target, BarChart3, PieChart, Activity, Award, Clock, MapPin, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      current: 15420,
      projected: 18750,
      growth: 21.6,
      trend: 'up'
    },
    customers: {
      current: 342,
      projected: 412,
      growth: 20.5,
      trend: 'up'
    },
    employees: {
      current: 28,
      projected: 35,
      growth: 25.0,
      trend: 'up'
    },
    satisfaction: {
      current: 4.7,
      projected: 4.8,
      growth: 2.1,
      trend: 'up'
    },
    predictions: {
      nextMonth: {
        revenue: 18750,
        customers: 412,
        employees: 35,
        satisfaction: 4.8
      },
      nextQuarter: {
        revenue: 24500,
        customers: 580,
        employees: 45,
        satisfaction: 4.9
      },
      nextYear: {
        revenue: 125000,
        customers: 2500,
        employees: 180,
        satisfaction: 4.9
      }
    },
    insights: [
      {
        type: 'revenue',
        message: 'Revenue growing 21.6% month-over-month',
        impact: 'high',
        confidence: 94
      },
      {
        type: 'customers',
        message: 'Customer acquisition cost decreasing by 15%',
        impact: 'medium',
        confidence: 87
      },
      {
        type: 'efficiency',
        message: 'Employee efficiency improving by 23%',
        impact: 'high',
        confidence: 91
      },
      {
        type: 'market',
        message: 'Market penetration opportunity in 3 new cities',
        impact: 'high',
        confidence: 89
      }
    ],
    trends: {
      peakHours: ['9:00 AM', '2:00 PM', '6:00 PM'],
      popularServices: ['Standard Cleanup', 'Premium Service', 'Quick Cleanup'],
      growthAreas: ['Downtown', 'Midtown', 'Uptown'],
      seasonalPatterns: {
        spring: 'High demand',
        summer: 'Peak season',
        fall: 'Moderate',
        winter: 'Low demand'
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        revenue: {
          ...prev.revenue,
          current: prev.revenue.current + Math.floor(Math.random() * 100)
        }
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportReport = () => {
    toast.success('Analytics report exported!', {
      description: 'PDF report downloaded to your device'
    });
  };

  const handleGenerateInsights = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('New AI insights generated!', {
        description: 'Updated predictions and recommendations available'
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predictive Analytics Dashboard</h1>
          <p className="text-gray-600">AI-powered business intelligence and forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleGenerateInsights} disabled={loading}>
            <Brain className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Insights'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">${analyticsData.revenue.current.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.revenue.trend)}
                  <span className="text-sm text-green-600">+{analyticsData.revenue.growth}%</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">{analyticsData.customers.current}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.customers.trend)}
                  <span className="text-sm text-green-600">+{analyticsData.customers.growth}%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold">{analyticsData.employees.current}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.employees.trend)}
                  <span className="text-sm text-green-600">+{analyticsData.employees.growth}%</span>
                </div>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold">{analyticsData.satisfaction.current}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analyticsData.satisfaction.trend)}
                  <span className="text-sm text-green-600">+{analyticsData.satisfaction.growth}%</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              AI Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Next Month</p>
                  <p className="text-sm text-gray-600">Revenue: ${analyticsData.predictions.nextMonth.revenue.toLocaleString()}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">94% Confidence</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Next Quarter</p>
                  <p className="text-sm text-gray-600">Revenue: ${analyticsData.predictions.nextQuarter.revenue.toLocaleString()}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">87% Confidence</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium">Next Year</p>
                  <p className="text-sm text-gray-600">Revenue: ${analyticsData.predictions.nextYear.revenue.toLocaleString()}</p>
                </div>
                <Badge className="bg-purple-100 text-purple-800">76% Confidence</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.insights.map((insight, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium">{insight.message}</p>
                  <Badge className={getImpactColor(insight.impact)}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Confidence</span>
                  <Progress value={insight.confidence} className="w-20 h-2" />
                  <span className="text-xs font-medium">{insight.confidence}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Trends and Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Peak Hours</h4>
              <div className="flex gap-2">
                {analyticsData.trends.peakHours.map((hour, index) => (
                  <Badge key={index} variant="outline">{hour}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Growth Areas</h4>
              <div className="flex gap-2">
                {analyticsData.trends.growthAreas.map((area, index) => (
                  <Badge key={index} className="bg-green-100 text-green-800">{area}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Seasonal Patterns</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analyticsData.trends.seasonalPatterns).map(([season, demand]) => (
                  <div key={season} className="flex justify-between">
                    <span className="capitalize">{season}:</span>
                    <span className="font-medium">{demand}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer Acquisition Cost</span>
                <span className="font-medium">$24.50</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer Lifetime Value</span>
                <span className="font-medium">$1,240</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Employee Efficiency</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service Completion Rate</span>
                <span className="font-medium">98.5%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 