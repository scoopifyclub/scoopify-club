'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ChevronDown, 
  Download,
  DollarSign, 
  BarChart3, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  type: 'payment' | 'bonus' | 'refund';
}

interface EarningsData {
  currentPeriodEarnings: number;
  previousPeriodEarnings: number;
  percentageChange: number;
  totalEarnings: number;
  projectedEarnings: number;
  transactions: Transaction[];
  weeklyEarnings: {
    week: string;
    amount: number;
  }[];
}

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/employee/dashboard/earnings');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchEarningsData();
    }
  }, [status, session, router, timeframe]);

  const fetchEarningsData = async () => {
    try {
      setError(null);
      // In a real app, fetch from API based on timeframe
      // For demo purposes, using mock data
      const mockEarningsData: EarningsData = {
        currentPeriodEarnings: 1250.75,
        previousPeriodEarnings: 1100.50,
        percentageChange: 13.7,
        totalEarnings: 6752.25,
        projectedEarnings: 1500.00,
        transactions: [
          {
            id: '1',
            date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
            amount: 45.00,
            status: 'completed',
            description: 'Payment for job #1234',
            type: 'payment'
          },
          {
            id: '2',
            date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
            amount: 35.50,
            status: 'completed',
            description: 'Payment for job #1235',
            type: 'payment'
          },
          {
            id: '3',
            date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
            amount: 10.00,
            status: 'completed',
            description: 'Customer tip',
            type: 'bonus'
          },
          {
            id: '4',
            date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
            amount: 42.25,
            status: 'completed',
            description: 'Payment for job #1236',
            type: 'payment'
          },
          {
            id: '5',
            date: format(subDays(new Date(), 9), 'yyyy-MM-dd'),
            amount: 50.00,
            status: 'completed',
            description: 'Payment for job #1237',
            type: 'payment'
          }
        ],
        weeklyEarnings: [
          { week: 'Week 1', amount: 325.50 },
          { week: 'Week 2', amount: 275.00 },
          { week: 'Week 3', amount: 350.25 },
          { week: 'Week 4', amount: 300.00 }
        ]
      };
      
      setEarningsData(mockEarningsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load earnings data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching earnings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = () => {
    try {
      // In a real app, generate and download a statement
      // Mock the download functionality
      toast.success('Statement download started successfully');
      
      // Simulate download completion after a delay
      setTimeout(() => {
        toast.success('Statement downloaded successfully');
      }, 2000);
    } catch (error) {
      toast.error('Failed to download statement. Please try again.');
      console.error('Error downloading statement:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!earningsData && !error) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
          No earnings data available. Please try again later.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Error loading earnings data</p>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => fetchEarningsData()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-amber-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'bonus':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'refund':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-gray-500">
            Track your income and payment history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center bg-white px-3 py-2 rounded-lg border cursor-pointer">
                <span className="font-medium">
                  {timeframe === 'weekly' ? 'This Week' : 
                   timeframe === 'monthly' ? `${format(startOfMonth(new Date()), 'MMM')} - ${format(endOfMonth(new Date()), 'MMM yyyy')}` : 
                   'This Year'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimeframe('weekly')}>
                Weekly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe('monthly')}>
                Monthly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe('yearly')}>
                Yearly
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={handleDownloadStatement}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current {timeframe} earnings</CardDescription>
            <CardTitle className="text-3xl font-bold">${earningsData.currentPeriodEarnings.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {earningsData.percentageChange >= 0 ? (
                <span className="flex items-center text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {earningsData.percentageChange}% from last {timeframe}
                </span>
              ) : (
                <span className="flex items-center text-sm text-red-600">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  {Math.abs(earningsData.percentageChange)}% from last {timeframe}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total earnings</CardDescription>
            <CardTitle className="text-3xl font-bold">${earningsData.totalEarnings.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">Lifetime earnings since joining</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projected earnings</CardDescription>
            <CardTitle className="text-3xl font-bold">${earningsData.projectedEarnings.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">Forecast for next {timeframe}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent transactions and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsData.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getTypeIcon(transaction.type)}
                            <span className="ml-2">{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{transaction.description}</td>
                        <td className="py-3 px-4 text-right font-medium">${transaction.amount.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Breakdown</CardTitle>
              <CardDescription>Analytics view of your earnings</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col justify-center items-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">Detailed earnings analytics would be displayed here</p>
              <p className="text-sm text-gray-400">Weekly earnings data visualization</p>
              <div className="w-full grid grid-cols-4 gap-2 mt-8">
                {earningsData.weeklyEarnings.map((week, index) => (
                  <div key={index} className="text-center">
                    <div className="h-24 bg-primary-100 rounded-md flex items-end justify-center p-2">
                      <div 
                        className="bg-primary w-full rounded-sm" 
                        style={{ 
                          height: `${(week.amount / Math.max(...earningsData.weeklyEarnings.map(w => w.amount))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs font-medium">{week.week}</div>
                    <div className="text-xs text-gray-500">${week.amount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 