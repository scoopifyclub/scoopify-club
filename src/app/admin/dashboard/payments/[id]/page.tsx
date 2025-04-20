'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  ClipboardList, 
  CreditCard, 
  AlertTriangle,
  Download,
  ReceiptText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface Payment {
  id: string;
  amount: number;
  status: 'successful' | 'refunded' | 'failed' | 'pending';
  date: string;
  paymentMethod: {
    type: string;
    last4: string;
    expiryDate?: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
  service?: {
    id: string;
    name: string;
    date: string;
    employee?: string;
  };
  invoiceNumber: string;
  receiptUrl?: string;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
}

export default function PaymentDetailPage() {
  const params = useParams();
  const paymentId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundFormData, setRefundFormData] = useState({
    amount: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/admin/dashboard/payments/${paymentId}`);
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchPaymentDetails();
    }
  }, [status, session, router, paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      // Mock data for demonstration
      const mockPayment: Payment = {
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
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error",
        description: "Failed to load payment details. Please try again.",
        variant: "destructive"
      });
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
      
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      
      toast({
        title: "Refund Processed",
        description: `A refund of $${refundAmount.toFixed(2)} has been processed successfully.`,
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Payment Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
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
            <ArrowLeft className="h-4 w-4 mr-2" />
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
            <Button variant="outline" onClick={() => window.open(payment.receiptUrl, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
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
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : payment.status === 'failed' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
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
                <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {payment.paymentMethod.type} •••• {payment.paymentMethod.last4}
                    {payment.paymentMethod.expiryDate && ` (Expires: ${payment.paymentMethod.expiryDate})`}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <ReceiptText className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Invoice Number</p>
                  <p className="text-sm text-muted-foreground">{payment.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
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
            <div className="flex items-start mb-6">
              <User className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-base font-semibold">{payment.customer.name}</p>
                <p className="text-sm text-muted-foreground">{payment.customer.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push(`/admin/dashboard/customers/${payment.customer.id}`)}
            >
              View Customer Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            {payment.service ? (
              <div className="space-y-4">
                <div className="flex items-start">
                  <ClipboardList className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Service</p>
                    <p className="text-base font-semibold">{payment.service.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Service Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(payment.service.date), 'MMMM d, yyyy')}
                      <span className="block">{format(parseISO(payment.service.date), 'h:mm a')}</span>
                    </p>
                  </div>
                </div>
                {payment.service.employee && (
                  <div className="flex items-start">
                    <User className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Provided By</p>
                      <p className="text-sm text-muted-foreground">{payment.service.employee}</p>
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={() => router.push(`/admin/dashboard/services/${payment.service?.id}`)}
                >
                  View Service Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No associated service</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Enter the refund amount and reason. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input 
                  id="refundAmount" 
                  type="number"
                  className="pl-7"
                  placeholder="0.00"
                  value={refundFormData.amount}
                  onChange={(e) => setRefundFormData({...refundFormData, amount: e.target.value})}
                  min="0.01"
                  max={payment.amount}
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum refund amount: ${payment.amount.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundReason">Reason for Refund</Label>
              <textarea 
                id="refundReason" 
                className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={refundFormData.reason}
                onChange={(e) => setRefundFormData({...refundFormData, reason: e.target.value})}
                placeholder="Please provide a reason for this refund..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
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