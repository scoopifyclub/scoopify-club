import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface Referral {
  id: string;
  referrer: {
    user: {
      name: string;
      email: string;
    };
  };
  customer: {
    user: {
      name: string;
      email: string;
    };
  };
  status: string;
  createdAt: string;
  reward?: {
    id: string;
    status: string;
    amount: number;
    cashAppTransactionId?: string;
  };
}

interface ReferralStats {
  totalReferrals: number;
  pendingRewards: number;
  totalPaid: number;
  totalAmount: number;
}

export function ReferralManagement() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/referrals');
      if (!response.ok) throw new Error('Failed to fetch referrals');
      const data = await response.json();
      setReferrals(data.referrals);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (rewardId: string, cashAppTransactionId: string) => {
    if (!cashAppTransactionId) {
      toast.error('Please enter a Cash App transaction ID');
      return;
    }

    setProcessingId(rewardId);
    try {
      const response = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          rewardId,
          status: 'PAID',
          cashAppTransactionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update reward status');
      
      await fetchReferrals();
      toast.success('Reward marked as paid');
    } catch (error) {
      console.error('Error updating reward:', error);
      toast.error('Failed to update reward status');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.pendingRewards || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalPaid || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalAmount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{referral.referrer.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {referral.referrer.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{referral.customer.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {referral.customer.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        referral.status === 'COMPLETED'
                          ? 'default'
                          : referral.status === 'PENDING'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {referral.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {referral.reward ? (
                      <div>
                        <div className="font-medium">${referral.reward.amount}</div>
                        <Badge
                          variant={
                            referral.reward.status === 'PAID'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {referral.reward.status}
                        </Badge>
                      </div>
                    ) : (
                      'No reward'
                    )}
                  </TableCell>
                  <TableCell>
                    {referral.reward?.status === 'PENDING' && (
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Cash App Transaction ID"
                          className="w-48"
                          id={`transaction-${referral.reward.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            handleMarkAsPaid(
                              referral.reward!.id,
                              (
                                document.getElementById(
                                  `transaction-${referral.reward!.id}`
                                ) as HTMLInputElement
                              ).value
                            )
                          }
                          disabled={processingId === referral.reward!.id}
                        >
                          Mark as Paid
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 