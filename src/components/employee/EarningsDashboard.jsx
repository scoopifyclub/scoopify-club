import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, Download } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
export function EarningsDashboard() {
    const [earnings, setEarnings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date(),
    });
    useEffect(() => {
        fetchEarnings();
    }, [dateRange]);
    const fetchEarnings = async () => {
        try {
            const response = await fetch(`/api/employee/earnings?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok)
                throw new Error('Failed to fetch earnings');
            const data = await response.json();
            setEarnings(data.earnings);
            setStats(data.stats);
        }
        catch (error) {
            console.error('Error fetching earnings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const exportToCSV = () => {
        const headers = ['Date', 'Customer', 'Plan', 'Amount', 'Status'];
        const csvContent = [
            headers.join(','),
            ...earnings.map(earning => [
                format(new Date(earning.payment.date), 'MM/dd/yyyy'),
                earning.payment.subscription.customer.name,
                earning.payment.subscription.plan,
                earning.amount.toFixed(2),
                earning.status
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `earnings_${format(dateRange.from, 'MM-dd-yyyy')}_to_${format(dateRange.to, 'MM-dd-yyyy')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }
    return (<div className="space-y-6">
      <div className="flex justify-between items-center">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange}/>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4"/>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats === null || stats === void 0 ? void 0 : stats.totalEarned.toFixed(2)) || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats === null || stats === void 0 ? void 0 : stats.pendingAmount.toFixed(2)) || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats === null || stats === void 0 ? void 0 : stats.totalJobs) || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.map((earning) => (<TableRow key={earning.id}>
                  <TableCell>
                    {format(new Date(earning.payment.date), 'MM/dd/yyyy')}
                  </TableCell>
                  <TableCell>{earning.payment.subscription.customer.name}</TableCell>
                  <TableCell>{earning.payment.subscription.plan}</TableCell>
                  <TableCell>${earning.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={earning.status === 'PAID'
                ? 'default'
                : earning.status === 'PENDING'
                    ? 'secondary'
                    : 'destructive'}>
                      {earning.status}
                    </Badge>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>);
}
