'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, User, ClipboardList, CreditCard, AlertTriangle, Download, ReceiptText, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function PaymentDetailPage() {
    const params = useParams();
    const paymentId = params.id;
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [payment, setPayment] = useState(null);
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
    const [refundFormData, setRefundFormData] = useState({
        amount: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPaymentDetails();
        }
    }, [status, paymentId]);

    const fetchPaymentDetails = async () => {
        try {
            const response = await fetch(`/api/admin/payments/${paymentId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payment details');
            }

            const data = await response.json();
            setPayment(data);
        } catch (error) {
            console.error('Error fetching payment details:', error);
            toast.error('Failed to load payment details');

            // Fallback to demo data in development
            if (process.env.NODE_ENV === 'development') {
                const mockPayment = {
                    id: paymentId,
                    amount: 120.00,
                    status: 'successful',
                    date: '2023-11-15T14:30:00Z',
                    paymentMethod: {
                        type: 'visa',
                        last4: '4242',
                        expiryDate: '04/25'
                    },
                    customer: {
                        id: 'cust123',
                        name: 'John Smith',
                        email: 'john.smith@example.com'
                    },
                    service: {
                        id: 'serv456',
                        name: 'Deep Cleaning',
                        date: '2023-11-15T10:00:00Z',
                        employee: 'Sarah Johnson'
                    },
                    invoiceNumber: 'INV-2023-0042',
                    receiptUrl: '#'
                };
                setPayment(mockPayment);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!payment) return;

        setIsSubmitting(true);

        try {
            // Validate refund amount
            const refundAmount = parseFloat(refundFormData.amount);
            if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) {
                throw new Error('Invalid refund amount');
            }

            const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    amount: refundAmount,
                    reason: refundFormData.reason
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to process refund');
            }

            const data = await response.json();
            
            // Update payment state with refund info
            setPayment(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: 'refunded',
                    refundAmount: refundAmount,
                    refundReason: refundFormData.reason,
                    refundDate: new Date().toISOString()
                };
            });

            setIsRefundDialogOpen(false);
            toast.success(`Refund of $${refundAmount.toFixed(2)} processed successfully`);
        } catch (error) {
            console.error('Error processing refund:', error);
            toast.error('Failed to process refund');
        } finally {
            setIsSubmitting(false);
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

    if (!payment) {
        return (
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Payment Not Found</h1>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
                            <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
                            <p className="text-muted-foreground mb-4">
                                The payment you are looking for does not exist or has been removed.
                            </p>
                            <Button onClick={() => router.push('/admin/dashboard/payments')}>
                                Return to Payments
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center">
                    <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Payment #{payment.invoiceNumber}</h1>
                        <div className="flex items-center mt-1">
                            <p className="text-sm text-muted-foreground mr-2">
                                {format(parseISO(payment.date), 'MMMM d, yyyy h:mm a')}
                            </p>
                            {getStatusBadge(payment.status)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {payment.receiptUrl && (
                        <Button variant="outline" onClick={() => window.open(`/api/admin/payments/${payment.id}/receipt`, '_blank')}>
                            <Download className="h-4 w-4 mr-2"/>
                            Download Receipt
                        </Button>
                    )}
                    {payment.status === 'successful' && (
                        <Button variant="default" onClick={() => setIsRefundDialogOpen(true)}>
                            Process Refund
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 border rounded-md">
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl font-bold">${payment.amount.toFixed(2)}</p>
                                    {payment.status === 'successful' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500"/>
                                    ) : payment.status === 'failed' ? (
                                        <XCircle className="h-5 w-5 text-red-500"/>
                                    ) : null}
                                </div>
                            </div>

                            {payment.status === 'refunded' && payment.refundAmount && (
                                <div className="p-3 border rounded-md">
                                    <p className="text-xs text-muted-foreground">Refund Amount</p>
                                    <p className="text-xl font-bold">${payment.refundAmount.toFixed(2)}</p>
                                    {payment.refundDate && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Refunded on {format(parseISO(payment.refundDate), 'MMM d, yyyy')}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-start">
                                <CreditCard className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Payment Method</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {payment.paymentMethod.type} •••• {payment.paymentMethod.last4}
                                        {payment.paymentMethod.expiryDate && ` (Expires: ${payment.paymentMethod.expiryDate})`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <ReceiptText className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Invoice Number</p>
                                    <p className="text-sm text-muted-foreground">{payment.invoiceNumber}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Calendar className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Transaction Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(parseISO(payment.date), 'MMMM d, yyyy')}
                                        <span className="block">{format(parseISO(payment.date), 'h:mm a')}</span>
                                    </p>
                                </div>
                            </div>

                            {payment.status === 'refunded' && payment.refundReason && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                    <p className="text-sm font-medium">Refund Reason</p>
                                    <p className="text-sm">{payment.refundReason}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <User className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Customer Name</p>
                                    <p className="text-sm text-muted-foreground">{payment.customer.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <ClipboardList className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Customer ID</p>
                                    <p className="text-sm text-muted-foreground">{payment.customer.id}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Calendar className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Service Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(parseISO(payment.service.date), 'MMMM d, yyyy')}
                                        <span className="block">{format(parseISO(payment.service.date), 'h:mm a')}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <User className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Assigned Employee</p>
                                    <p className="text-sm text-muted-foreground">{payment.service.employee}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Service Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <ClipboardList className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Service Type</p>
                                    <p className="text-sm text-muted-foreground">{payment.service.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Calendar className="h-5 w-5 mr-3 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm font-medium">Service ID</p>
                                    <p className="text-sm text-muted-foreground">{payment.service.id}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Refund</DialogTitle>
                        <DialogDescription>
                            Enter the refund amount and reason. The maximum refund amount is ${payment.amount.toFixed(2)}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Refund Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={payment.amount}
                                    className="pl-7"
                                    value={refundFormData.amount}
                                    onChange={(e) => setRefundFormData(prev => ({
                                        ...prev,
                                        amount: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Refund</Label>
                            <Input
                                id="reason"
                                value={refundFormData.reason}
                                onChange={(e) => setRefundFormData(prev => ({
                                    ...prev,
                                    reason: e.target.value
                                }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRefundDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRefund}
                            disabled={isSubmitting || !refundFormData.amount || !refundFormData.reason}
                        >
                            {isSubmitting ? 'Processing...' : 'Process Refund'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
