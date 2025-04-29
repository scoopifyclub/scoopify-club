'use client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
const payments = [
    {
        id: 1,
        date: '2024-03-15',
        amount: 29.99,
        status: 'paid',
        description: 'Weekly Service - March 15'
    },
    {
        id: 2,
        date: '2024-03-08',
        amount: 29.99,
        status: 'paid',
        description: 'Weekly Service - March 8'
    },
    {
        id: 3,
        date: '2024-03-01',
        amount: 29.99,
        status: 'paid',
        description: 'Weekly Service - March 1'
    }
];
export default function BillingPage() {
    return (<DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Billing</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Weekly Service</p>
                  <p className="text-sm text-muted-foreground">
                    Every Friday at 9:00 AM
                  </p>
                </div>
                <div className="text-2xl font-bold">$29.99</div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500"/>
                <span className="text-sm text-muted-foreground">
                  Next payment: March 22, 2024
                </span>
              </div>
              <Button variant="outline" className="w-full">
                Change Plan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-8 w-8"/>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">
                    Expires 12/2025
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (<div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground"/>
                      <span className="font-medium">{payment.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">
                        <DollarSign className="inline-block h-4 w-4"/>
                        {payment.amount}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {payment.status}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Receipt
                    </Button>
                  </div>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}
