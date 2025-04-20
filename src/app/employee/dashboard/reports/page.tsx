'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { 
  Download, 
  CalendarRange, 
  TrendingUp, 
  Star, 
  Clock, 
  Users, 
  DollarSign, 
  ThumbsUp,
  Award,
  CheckCircle2
} from 'lucide-react';

// Mock data for the charts
const weeklyPerformanceData = [
  { name: 'Mon', services: 4, onTime: 4, rating: 4.7 },
  { name: 'Tue', services: 6, onTime: 5, rating: 4.8 },
  { name: 'Wed', services: 5, onTime: 5, rating: 4.9 },
  { name: 'Thu', services: 7, onTime: 7, rating: 5.0 },
  { name: 'Fri', services: 6, onTime: 6, rating: 4.6 },
  { name: 'Sat', services: 3, onTime: 3, rating: 4.8 },
  { name: 'Sun', services: 0, onTime: 0, rating: 0 },
];

const monthlyEarningsData = [
  { name: 'Week 1', earnings: 520 },
  { name: 'Week 2', earnings: 610 },
  { name: 'Week 3', earnings: 580 },
  { name: 'Week 4', earnings: 670 },
];

const customerReviewsData = [
  { name: '5 ★', value: 78 },
  { name: '4 ★', value: 15 },
  { name: '3 ★', value: 5 },
  { name: '2 ★', value: 2 },
  { name: '1 ★', value: 0 },
];

const COLORS = ['#22c55e', '#84cc16', '#facc15', '#f97316', '#ef4444'];

const serviceTypeData = [
  { name: 'Regular Pool Service', value: 65 },
  { name: 'Deep Cleaning', value: 20 },
  { name: 'Chemical Treatment', value: 15 },
];

const SERVICE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    totalServices: 0,
    onTimeRate: 0,
    avgRating: 0,
    totalEarnings: 0,
    customerSatisfaction: 0,
    completionRate: 0,
  });
  
  // Load mock data
  useEffect(() => {
    setTimeout(() => {
      setPerformanceData({
        totalServices: 31,
        onTimeRate: 94,
        avgRating: 4.8,
        totalEarnings: 2380,
        customerSatisfaction: 96,
        completionRate: 100,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-gray-500">
            Track your service metrics, earnings, and customer satisfaction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[160px]">
              <CalendarRange className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Services</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{performanceData.totalServices}</CardTitle>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              8% more than last {timeframe}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>On-Time Rate</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{performanceData.onTimeRate}%</CardTitle>
              <Clock className="h-6 w-6 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              2% better than last {timeframe}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{performanceData.avgRating}</CardTitle>
              <Star className="h-6 w-6 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${star <= Math.round(performanceData.avgRating) 
                    ? 'text-amber-500 fill-amber-500' 
                    : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              from {performanceData.totalServices} reviews
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earnings</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">${performanceData.totalEarnings}</CardTitle>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              12% more than last {timeframe}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Customer Satisfaction</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{performanceData.customerSatisfaction}%</CardTitle>
              <ThumbsUp className="h-6 w-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Consistently high rating
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{performanceData.completionRate}%</CardTitle>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              All scheduled services completed
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Charts */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="feedback">Customer Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>
                  Services completed and on-time rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="services" name="Services Completed" fill="#3b82f6" />
                      <Bar yAxisId="left" dataKey="onTime" name="On-Time Services" fill="#22c55e" />
                      <Line yAxisId="right" type="monotone" dataKey="rating" name="Avg Rating" stroke="#f59e0b" activeDot={{ r: 8 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Breakdown</CardTitle>
                <CardDescription>
                  Types of services performed
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance Metrics</CardTitle>
              <CardDescription>
                Detailed breakdown of service efficiency and quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="20%" 
                    outerRadius="80%" 
                    barSize={20} 
                    data={[
                      { name: 'On-Time Rate', value: performanceData.onTimeRate, fill: '#3b82f6' },
                      { name: 'Completion Rate', value: performanceData.completionRate, fill: '#22c55e' },
                      { name: 'Customer Satisfaction', value: performanceData.customerSatisfaction, fill: '#f59e0b' },
                      { name: 'Quality Score', value: 92, fill: '#8b5cf6' },
                    ]}
                  >
                    <RadialBar
                      label={{ fill: '#666', position: 'insideStart' }}
                      background
                      dataKey="value"
                    />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="earnings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>
                Track your earnings over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyEarningsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" name="Weekly Earnings" stroke="#22c55e" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Earnings Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-lg font-medium">${performanceData.totalEarnings}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Projected</p>
                    <p className="text-lg font-medium">${Math.round(performanceData.totalEarnings * 1.2)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Avg Per Service</p>
                    <p className="text-lg font-medium">${Math.round(performanceData.totalEarnings / performanceData.totalServices)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Feedback</CardTitle>
              <CardDescription>
                Customer ratings and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerReviewsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerReviewsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500 mr-1" />
                        <h4 className="font-medium">Average Rating</h4>
                      </div>
                      <span className="text-xl font-bold">{performanceData.avgRating}</span>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const data = customerReviewsData.find(d => d.name === `${rating} ★`);
                        const percentage = data ? data.value : 0;
                        
                        return (
                          <div key={rating} className="flex items-center text-sm">
                            <span className="w-8 mr-2">{rating} ★</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-amber-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-gray-500">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Recent Customer Comments</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center">
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">John S.</span>
                        </div>
                        <p className="text-sm mt-1">
                          "Always on time and does an excellent job with our pool. Highly recommended!"
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">Sarah J.</span>
                        </div>
                        <p className="text-sm mt-1">
                          "Very thorough and professional service. Our pool has never looked better."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Achievements and Badges */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Recognition for your outstanding performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Award className="h-10 w-10 text-amber-500 mb-2" />
              <h4 className="font-medium">Top Performer</h4>
              <p className="text-xs text-gray-500">April 2023</p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Star className="h-10 w-10 text-blue-500 mb-2" />
              <h4 className="font-medium">5-Star Service</h4>
              <p className="text-xs text-gray-500">10 consecutive ratings</p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Clock className="h-10 w-10 text-emerald-500 mb-2" />
              <h4 className="font-medium">Always On Time</h4>
              <p className="text-xs text-gray-500">30+ days streak</p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <CheckCircle2 className="h-10 w-10 text-purple-500 mb-2" />
              <h4 className="font-medium">Perfect Completion</h4>
              <p className="text-xs text-gray-500">100% completion rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 