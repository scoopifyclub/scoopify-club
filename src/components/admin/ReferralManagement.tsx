'use client';

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
import { DollarSign, CheckCircle, AlertCircle, Copy, RefreshCw, Users } from 'lucide-react';

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

/**
 * ReferralManagement component for managing referral codes and viewing statistics
 * @returns {JSX.Element} The ReferralManagement component
 */
export default function ReferralManagement() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(/** @type {ReferralCode|null} */ (null));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReferrals();
    fetchReferralStats();
    fetchReferralCode();
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

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals/stats');
      if (!response.ok) throw new Error('Failed to fetch referral stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast.error('Failed to load referral statistics');
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await fetch('/api/referrals');
      if (!response.ok) throw new Error('Failed to fetch referral code');
      const data = await response.json();
      setReferralCode(data);
    } catch (error) {
      console.error('Error fetching referral code:', error);
      toast.error('Failed to load referral code');
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

  /**
   * Generates a new referral code
   */
  const generateNewCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/referrals/generate', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate new code');
      const data = await response.json();
      setReferralCode(data);
      toast.success('New referral code generated');
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast.error('Failed to generate new referral code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copies the referral URL to clipboard
   */
  const copyReferralUrl = async () => {
    if (!referralCode?.url) return;
    try {
      await navigator.clipboard.writeText(referralCode.url);
      toast.success('Referral link copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy referral link');
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

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>Share this code with potential customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Code</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={referralCode?.code || ''}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyReferralUrl}
                disabled={!referralCode?.url}
              >
                <Copy className="h-4 w-4"/>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={generateNewCode}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">
              Created: {referralCode?.createdAt ? new Date(referralCode.createdAt).toLocaleDateString() : 'N/A'}
            </Badge>
            <Badge variant="secondary">
              Uses: {referralCode?.uses || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 