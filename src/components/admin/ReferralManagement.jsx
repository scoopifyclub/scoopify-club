"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { Label } from '@/components/ui/label';

export default function ReferralManagement() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReferral, setNewReferral] = useState({ code: '', discount: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReferrals, setFilteredReferrals] = useState([]);

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = referrals.filter(
        (referral) =>
          referral.referrer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          referral.referred.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReferrals(filtered);
    } else {
      setFilteredReferrals(referrals);
    }
  }, [searchTerm, referrals]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/referrals', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch referrals');
      const data = await response.json();
      setReferrals(data);
      setFilteredReferrals(data);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load referrals');
    }
    setLoading(false);
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newReferral),
      });
      if (!response.ok) throw new Error('Failed to create referral');
      await fetchReferrals();
      setNewReferral({ code: '', discount: '' });
      toast.success('Referral code created successfully');
    } catch (error) {
      setError(error.message);
      toast.error('Failed to create referral code');
    }
  };

  const handleDeleteReferral = async (id) => {
    try {
      const response = await fetch(`/api/admin/referrals/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete referral');
      await fetchReferrals();
      toast.success('Referral code deleted successfully');
    } catch (error) {
      setError(error.message);
      toast.error('Failed to delete referral code');
    }
  };

  const handleMarkAsPaid = async (rewardId, cashAppTransactionId) => {
    if (!cashAppTransactionId) {
      toast.error('Please enter a Cash App transaction ID');
      return;
    }
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
      if (!response.ok)
        throw new Error('Failed to update reward status');
      await fetchReferrals();
      toast.success('Reward marked as paid');
    }
    catch (error) {
      console.error('Error updating reward:', error);
      toast.error('Failed to update reward status');
    }
  };

  const handleStripePayout = async (override = false) => {
    try {
      const res = await fetch('/api/admin/referrals/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ override }),
      });
      const data = await res.json();
      if (data.warning) {
        if (window.confirm(data.message + '\nProceed anyway?')) {
          await handleStripePayout(true);
          return;
        } else {
          return;
        }
      }
      if (data.success) {
        toast.success(`Referral payouts processed: ${data.paidCount}`);
      } else {
        toast.error(data.error || 'Payout failed');
      }
    } catch (e) {
      toast.error('Error processing payouts');
    }
  };

  const handlePayReferral = async (referralId) => {
    try {
      const response = await fetch(`/api/admin/referrals/${referralId}/pay`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to pay referral');
      }
      toast.success('Referral payment processed successfully');
      fetchReferrals(); // Refresh the list
    } catch (error) {
      toast.error('Failed to process referral payment');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats === null || stats === void 0 ? void 0 : stats.totalReferrals) || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats === null || stats === void 0 ? void 0 : stats.pendingRewards) || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats === null || stats === void 0 ? void 0 : stats.totalPaid) || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats === null || stats === void 0 ? void 0 : stats.totalAmount) || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mb-2">
        <Button onClick={() => handleStripePayout(false)} variant="destructive">
          Process Stripe Referral Payouts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateReferral} className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Referral Code"
                value={newReferral.code}
                onChange={(e) => setNewReferral({ ...newReferral, code: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Discount Amount"
                value={newReferral.discount}
                onChange={(e) => setNewReferral({ ...newReferral, discount: e.target.value })}
                required
              />
            </div>
            <Button type="submit">Create Referral Code</Button>
          </form>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <p className="text-center text-gray-500">No referral codes found</p>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{referral.code}</p>
                    <p className="text-sm text-gray-500">
                      Discount: ${referral.discount}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReferral(referral.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2">
        <Label htmlFor="search">Search:</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referrer</TableHead>
            <TableHead>Referred</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReferrals.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell>{referral.referrer.name}</TableCell>
              <TableCell>{referral.referred.name}</TableCell>
              <TableCell>{referral.status}</TableCell>
              <TableCell>${referral.amount}</TableCell>
              <TableCell>
                {new Date(referral.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {referral.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePayReferral(referral.id)}
                  >
                    Pay Now
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
