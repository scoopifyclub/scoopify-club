'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface EarningsData {
  date: string;
  amount: number;
  services: number;
  hours: number;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  description: string;
}

export default function EmployeeEarningsPage() {
  const { data: session, status } = useSession();
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalServices: 0,
    totalHours: 0,
    averagePerService: 0,
    previousPeriodComparison: 0
  });

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // In a real app, you would fetch this data from your API
          // This is just mock data for demonstration
          setTimeout(() => {
            // Generate mock data based on time range
            let mockData: EarningsData[] = [];
            let mockPayments: PaymentHistory[] = [];
            let mockStats = {
              totalEarnings: 0,
              totalServices: 0,
              totalHours: 0,
              averagePerService: 0,
              previousPeriodComparison: 0
            };
            
            if (timeRange === 'week') {
              // Last 7 days
              mockData = Array.from({ length: 7 }, (_, i) => {
                const amount = Math.floor(Math.random() * 80) + 40;
                const services = Math.floor(Math.random() * 3) + 1;
                const hours = services * 2 + Math.floor(Math.random() * 2);
                
                return {
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                  amount,
                  services,
                  hours
                };
              });
              
              mockStats = {
                totalEarnings: mockData.reduce((sum, item) => sum + item.amount, 0),
                totalServices: mockData.reduce((sum, item) => sum + item.services, 0),
                totalHours: mockData.reduce((sum, item) => sum + item.hours, 0),
                averagePerService: Math.round(mockData.reduce((sum, item) => sum + item.amount, 0) / mockData.reduce((sum, item) => sum + item.services, 0)),
                previousPeriodComparison: Math.floor(Math.random() * 30) - 10
              };
            } else if (timeRange === 'month') {
              // Last 4 weeks
              mockData = Array.from({ length: 4 }, (_, i) => {
                const amount = Math.floor(Math.random() * 350) + 200;
                const services = Math.floor(Math.random() * 10) + 5;
                const hours = services * 2 + Math.floor(Math.random() * 5);
                
                return {
                  date: `Week ${i + 1}`,
                  amount,
                  services,
                  hours
                };
              });
              
              mockStats = {
                totalEarnings: mockData.reduce((sum, item) => sum + item.amount, 0),
                totalServices: mockData.reduce((sum, item) => sum + item.services, 0),
                totalHours: mockData.reduce((sum, item) => sum + item.hours, 0),
                averagePerService: Math.round(mockData.reduce((sum, item) => sum + item.amount, 0) / mockData.reduce((sum, item) => sum + item.services, 0)),
                previousPeriodComparison: Math.floor(Math.random() * 20) - 5
              };
            } else {
              // Last 6 months
              mockData = Array.from({ length: 6 }, (_, i) => {
                const amount = Math.floor(Math.random() * 1200) + 800;
                const services = Math.floor(Math.random() * 30) + 20;
                const hours = services * 2 + Math.floor(Math.random() * 20);
                
                return {
                  date: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
                  amount,
                  services,
                  hours
                };
              });
              
              mockStats = {
                totalEarnings: mockData.reduce((sum, item) => sum + item.amount, 0),
                totalServices: mockData.reduce((sum, item) => sum + item.services, 0),
                totalHours: mockData.reduce((sum, item) => sum + item.hours, 0),
                averagePerService: Math.round(mockData.reduce((sum, item) => sum + item.amount, 0) / mockData.reduce((sum, item) => sum + item.services, 0)),
                previousPeriodComparison: Math.floor(Math.random() * 15) - 3
              };
            }
            
            // Generate payment history
            mockPayments = Array.from({ length: 5 }, (_, i) => ({
              id: `pay-${i}`,
              date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              amount: Math.floor(Math.random() * 500) + 200,
              status: i === 0 ? 'pending' : i === 1 ? 'processing' : 'completed',
              description: `Payment for services - ${new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' })} Week ${Math.floor(Math.random() * 4) + 1}`
            }));
            
            setEarningsData(mockData);
            setPaymentHistory(mockPayments);
            setStats(mockStats);
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          console.error('Error fetching earnings data:', error);
          setIsLoading(false);
        }
      }
    };
    
    fetchEarningsData();
  }, [session, status, timeRange]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings Dashboard</h1>
        <p className="text-gray-500">
          Track your income and service performance.
        </p>
      </div>
      
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="border rounded-md overflow-hidden">
          <Button 
            variant={timeRange === 'week' ? 'default' : 'ghost'} 
            className="rounded-none"
            onClick={() => setTimeRange('week')}
          >
            Weekly
          </Button>
          <Button 
            variant={timeRange === 'month' ? 'default' : 'ghost'} 
            className="rounded-none"
            onClick={() => setTimeRange('month')}
          >
            Monthly
          </Button>
          <Button 
            variant={timeRange === 'year' ? 'default' : 'ghost'} 
            className="rounded-none"
            onClick={() => setTimeRange('year')}
          >
            Yearly
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">${stats.totalEarnings}</div>
              <div className={`flex items-center ${stats.previousPeriodComparison >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.previousPeriodComparison >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                <span>{Math.abs(stats.previousPeriodComparison)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-gray-500">Completed jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-gray-500">Hours worked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Per Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averagePerService}</div>
            <p className="text-xs text-gray-500">Average earning per job</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>
            Your earnings and service trends for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="earnings">
            <TabsList className="mb-4">
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
            </TabsList>
            
            <TabsContent value="earnings">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} name="Earnings ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="services" fill="#3b82f6" name="Services Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="hours">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#8b5cf6" name="Hours Worked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payments and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{payment.date}</td>
                    <td className="px-4 py-3">{payment.description}</td>
                    <td className="px-4 py-3 font-medium">${payment.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {paymentHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 