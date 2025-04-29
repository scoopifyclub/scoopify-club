'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreVertical, Search, Download, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
    const router = useRouter();
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    
    const [isLoading, setIsLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({
        key: 'date',
        direction: 'desc'
    });
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [visibleFilters, setVisibleFilters] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPayments();
        }
    }, [status]);

    const fetchPayments = async () => {
        try {
            const response = await fetch('/api/admin/payments', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payments');
            }

            const data = await response.json();
            setPayments(data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');

            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                const mockPayments = [
                    {
                        id: 'pay_1234',
                        amount: 120.00,
                        status: 'successful',
                        date: '2023-11-15T14:30:00Z',
                        customer: {
                            name: 'John Smith',
                            email: 'john.smith@example.com'
                        },
                        paymentMethod: {
                            type: 'visa',
                            last4: '4242'
                        },
                        invoiceNumber: 'INV-2023-0042',
                        service: {
                            name: 'Deep Cleaning'
                        }
                    },
                    {
                        id: 'pay_1235',
                        amount: 85.50,
                        status: 'successful',
                        date: '2023-11-12T10:15:00Z',
                        customer: {
                            name: 'Sarah Johnson',
                            email: 'sarah.j@example.com'
                        },
                        paymentMethod: {
                            type: 'mastercard',
                            last4: '5678'
                        },
                        invoiceNumber: 'INV-2023-0041',
                        service: {
                            name: 'Regular Cleaning'
                        }
                    },
                    {
                        id: 'pay_1236',
                        amount: 65.00,
                        status: 'refunded',
                        date: '2023-11-10T09:20:00Z',
                        customer: {
                            name: 'Michael Brown',
                            email: 'm.brown@example.com'
                        },
                        paymentMethod: {
                            type: 'amex',
                            last4: '9876'
                        },
                        invoiceNumber: 'INV-2023-0040',
                        service: {
                            name: 'Window Cleaning'
                        }
                    },
                    {
                        id: 'pay_1237',
                        amount: 150.00,
                        status: 'pending',
                        date: '2023-11-14T11:45:00Z',
                        customer: {
                            name: 'Emily Davis',
                            email: 'emily.d@example.com'
                        },
                        paymentMethod: {
                            type: 'discover',
                            last4: '1234'
                        },
                        invoiceNumber: 'INV-2023-0039',
                        service: {
                            name: 'Deep Cleaning'
                        }
                    },
                    {
                        id: 'pay_1238',
                        amount: 95.00,
                        status: 'failed',
                        date: '2023-11-13T16:30:00Z',
                        customer: {
                            name: 'David Wilson',
                            email: 'david.w@example.com'
                        },
                        paymentMethod: {
                            type: 'visa',
                            last4: '4321'
                        },
                        invoiceNumber: 'INV-2023-0038',
                        service: {
                            name: 'Regular Cleaning'
                        }
                    }
                ];
                setPayments(mockPayments);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedPayments = () => {
        const filteredPayments = payments.filter(payment => {
            // Apply search filter
            const searchMatches = payment.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Apply status filter
            const statusMatches = statusFilter === 'all' || payment.status === statusFilter;
            
            // Apply date range filter
            const paymentDate = new Date(payment.date);
            const dateMatches = (!dateRange.from || paymentDate >= dateRange.from) &&
                (!dateRange.to || paymentDate <= dateRange.to);
            
            return searchMatches && statusMatches && dateMatches;
        });

        return [...filteredPayments].sort((a, b) => {
            if (sortConfig.key === 'date') {
                return sortConfig.direction === 'asc'
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'asc'
                    ? a.amount - b.amount
                    : b.amount - a.amount;
            }
            return 0;
        });
    };

    const handleExportPayments = async () => {
        try {
            const response = await fetch('/api/admin/payments/export', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to export payments');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Payments exported successfully');
        } catch (error) {
            console.error('Error exporting payments:', error);
            toast.error('Failed to export payments');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'successful':
                return <Badge className="bg-green-100 text-green-800">Successful</Badge>;
            case 'refunded':
                return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">Payments</h1>
                <div className="flex flex-col md:flex-row gap-2">
                    <Button variant="outline" onClick={handleExportPayments}>
                        <Download className="h-4 w-4 mr-2"/>
                        Export Payments
                    </Button>
                </div>
            </div>

            <Card className="mb-8">
                <CardHeader className="pb-2">
                    <CardTitle>Payment Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Search by customer, email, or invoice..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex items-center"
                                onClick={() => setVisibleFilters(!visibleFilters)}
                            >
                                <SlidersHorizontal className="h-4 w-4 mr-2"/>
                                Filters
                            </Button>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Filter by status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="successful">Successful</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="refunded">Refunded</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {visibleFilters && (
                        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/20 rounded-md">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium">Date Range</span>
                                <DateRangePicker
                                    value={dateRange}
                                    onChange={(value) => {
                                        setDateRange({
                                            from: value.from || subDays(new Date(), 30),
                                            to: value.to || new Date()
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
                                        <div className="flex items-center">
                                            Date
                                            <ArrowUpDown className="ml-2 h-4 w-4"/>
                                        </div>
                                    </TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead onClick={() => handleSort('amount')} className="cursor-pointer">
                                        <div className="flex items-center">
                                            Amount
                                            <ArrowUpDown className="ml-2 h-4 w-4"/>
                                        </div>
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getSortedPayments().length > 0 ? (
                                    getSortedPayments().map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                {format(parseISO(payment.date), 'MMM d, yyyy')}
                                                <div className="text-xs text-muted-foreground">
                                                    {format(parseISO(payment.date), 'h:mm a')}
                                                </div>
                                            </TableCell>
                                            <TableCell>{payment.invoiceNumber}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{payment.customer.name}</div>
                                                <div className="text-xs text-muted-foreground">{payment.customer.email}</div>
                                            </TableCell>
                                            <TableCell>{payment.service?.name || '—'}</TableCell>
                                            <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <span className="capitalize">{payment.paymentMethod.type}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        •••• {payment.paymentMethod.last4}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4"/>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/admin/dashboard/payments/${payment.id}`)}>
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {payment.status === 'successful' && (
                                                            <DropdownMenuItem onClick={() => router.push(`/admin/dashboard/payments/${payment.id}?refund=true`)}>
                                                                Process Refund
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => window.open(`/api/admin/payments/${payment.id}/receipt`, '_blank')}>
                                                            Download Receipt
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No payments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
