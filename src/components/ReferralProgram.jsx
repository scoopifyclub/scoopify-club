// Referral Program Integration Component
// For customer referrals and reward tracking
import React, { useState, useEffect } from 'react';
import { Users, Gift, Share2, Copy, ExternalLink, TrendingUp, Award, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { StatCard, ProgressBar, ActivityFeed } from '@/components/ui/data-visualization';
import { cn } from '@/lib/utils';

const ReferralProgram = ({
  customerId,
  onReferralCreated,
  onRewardClaimed,
  className,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Example referral data (replace with real data)
  const exampleReferralData = [
      {
          id: '1',
          customerId: 'customer_456',
          friendName: 'John Doe',
          referredEmail: 'friend1@example.com',
          status: 'COMPLETED',
          date: '2023-11-15',
          potentialEarnings: 5.00,
          rewardAmount: 30,
          rewardStatus: 'claimed',
          referredAt: '2024-01-15T10:30:00Z',
          completedAt: '2024-01-22T14:20:00Z',
          serviceType: 'Premium Weekly Service'
      },
      {
          id: '2',
          customerId: 'customer_456',
          friendName: 'Sarah Smith',
          referredEmail: 'friend2@example.com',
          status: 'PENDING',
          date: '2023-11-10',
          potentialEarnings: 5.00,
          rewardAmount: 30,
          rewardStatus: 'pending',
          referredAt: '2024-01-14T16:45:00Z',
          completedAt: null,
          serviceType: null
      },
      {
          id: '3',
          customerId: 'customer_456',
          friendName: 'Mike Wilson',
          referredEmail: 'friend3@example.com',
          status: 'COMPLETED',
          date: '2023-11-05',
          earnings: 5.00,
          rewardAmount: 30,
          rewardStatus: 'claimed',
          referredAt: '2024-01-10T09:15:00Z',
          completedAt: '2024-01-17T11:30:00Z',
          serviceType: 'Basic Weekly Service'
      }
  ];

  const mockRewards = [
    {
      id: 1,
      customerId: 'customer_456',
      referralId: 1,
      amount: 30,
      type: 'referral_bonus',
      status: 'claimed',
      claimedAt: '2024-01-22T15:00:00Z',
      description: 'Referral bonus for John Doe'
    },
    {
      id: 2,
      customerId: 'customer_456',
      referralId: 3,
      amount: 30,
      type: 'referral_bonus',
      status: 'claimed',
      claimedAt: '2024-01-17T12:00:00Z',
      description: 'Referral bonus for Mike Wilson'
    },
    {
      id: 3,
      customerId: 'customer_456',
      referralId: 2,
      amount: 30,
      type: 'referral_bonus',
      status: 'pending',
      claimedAt: null,
      description: 'Referral bonus for Sarah Smith (pending)'
    }
  ];

  useEffect(() => {
    // Load referral data
    setReferralData(exampleReferralData);
    setReferrals(exampleReferralData);
    setRewards(mockRewards);
    setLoading(false);
  }, [customerId]);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      alert('Referral link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const shareReferral = async (platform) => {
    const shareData = {
      title: 'Join Scoopify Club - Weekly Yard Cleanup Service',
      text: `I love my weekly yard cleanup service from Scoopify Club! Use my referral code ${referralData.referralCode} to get $30 off your first month.`,
      url: referralData.referralLink
    };

    try {
      if (navigator.share && platform === 'native') {
        await navigator.share(shareData);
      } else {
        // Fallback for specific platforms
        const urls = {
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData.referralLink)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(referralData.referralLink)}`,
          email: `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + referralData.referralLink)}`,
          sms: `sms:?body=${encodeURIComponent(shareData.text + ' ' + referralData.referralLink)}`
        };

        if (urls[platform]) {
          window.open(urls[platform], '_blank');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const claimReward = async (rewardId) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRewards(prev => prev.map(r => r.id === rewardId ? result : r));
        onRewardClaimed?.(result);
        alert('Reward claimed successfully!');
      } else {
        throw new Error('Failed to claim reward');
      }
    } catch (error) {
      console.error('Reward claim error:', error);
      alert('Failed to claim reward. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getRewardStatusBadge = (status) => {
    const variants = {
      claimed: 'default',
      pending: 'secondary',
      expired: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Referrals"
          value={referralData.totalReferrals}
          subtitle="people referred"
          icon="users"
          trend="+2"
          trendDirection="up"
        />
        <StatCard
          title="Successful Referrals"
          value={referralData.successfulReferrals}
          subtitle="completed signups"
          icon="check-circle"
        />
        <StatCard
          title="Total Rewards"
          value={`$${referralData.totalRewards}`}
          subtitle="earned"
          icon="gift"
        />
        <StatCard
          title="Available Rewards"
          value={`$${referralData.availableRewards}`}
          subtitle="to claim"
          icon="award"
        />
      </div>

      {/* Referral Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Progress</CardTitle>
          <CardDescription>
            Track your referral success rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-gray-600">
                {referralData.totalReferrals > 0 
                  ? Math.round((referralData.successfulReferrals / referralData.totalReferrals) * 100)
                  : 0}%
              </span>
            </div>
            <ProgressBar
              value={referralData.totalReferrals > 0 
                ? (referralData.successfulReferrals / referralData.totalReferrals) * 100
                : 0}
              className="w-full"
              color="green"
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{referralData.totalReferrals}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{referralData.successfulReferrals}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{referralData.pendingReferrals}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={exampleReferralData.slice(0, 5).map(r => ({
              id: r.id,
              title: `Referred ${r.referredName}`,
              description: r.status === 'completed' 
                ? `Completed signup - $${r.rewardAmount} reward earned`
                : 'Pending signup',
              timestamp: r.referredAt,
              icon: r.status === 'completed' ? 'check-circle' : 'clock',
              color: r.status === 'completed' ? 'green' : 'yellow'
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderReferrals = () => (
    <div className="space-y-4">
      {exampleReferralData.map((referral) => (
        <Card key={referral.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium">{referral.referredName}</h4>
                  {getStatusBadge(referral.status)}
                  {referral.serviceType && (
                    <Badge variant="outline">{referral.serviceType}</Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p>Email: {referral.referredEmail}</p>
                  <p>Referred: {new Date(referral.referredAt).toLocaleDateString()}</p>
                  {referral.completedAt && (
                    <p>Completed: {new Date(referral.completedAt).toLocaleDateString()}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">${referral.rewardAmount}</span>
                  </div>
                  {getRewardStatusBadge(referral.rewardStatus)}
                </div>
              </div>

              <div className="flex space-x-2">
                {referral.status === 'completed' && referral.rewardStatus === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => claimReward(referral.id)}
                    disabled={submitting}
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : <Gift className="w-4 h-4 mr-2" />}
                    Claim Reward
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-4">
      {mockRewards.map((reward) => (
        <Card key={reward.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium">{reward.description}</h4>
                  {getRewardStatusBadge(reward.status)}
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p>Amount: ${reward.amount}</p>
                  <p>Type: {reward.type.replace('_', ' ').toUpperCase()}</p>
                  {reward.claimedAt && (
                    <p>Claimed: {new Date(reward.claimedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-green-600">
                  ${reward.amount}
                </div>
                {reward.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => claimReward(reward.id)}
                    disabled={submitting}
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : <Gift className="w-4 h-4 mr-2" />}
                    Claim
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderShareModal = () => {
    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Share Your Referral</CardTitle>
            <CardDescription>
              Share your referral link and earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Link */}
            <div>
              <Label>Your Referral Link</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  value={referralData.referralLink}
                  readOnly
                  className="flex-1"
                />
                <Button size="sm" onClick={copyReferralLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <Label>Your Referral Code</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  value={referralData.referralCode}
                  readOnly
                  className="flex-1"
                />
                <Button size="sm" onClick={() => copyReferralLink()}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => shareReferral('facebook')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" onClick={() => shareReferral('twitter')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" onClick={() => shareReferral('email')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" onClick={() => shareReferral('sms')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                SMS
              </Button>
            </div>

            <Button onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <LoadingOverlay isLoading={submitting} message="Processing...">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Referral Program</h2>
              <p className="text-gray-600">
                Refer friends and earn rewards
              </p>
            </div>
            <Button onClick={() => setShowShareModal(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Referral
            </Button>
          </div>

          {/* Referral Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Program</CardTitle>
              <CardDescription>
                Earn $30 for each successful referral
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{referralData.referralCode}</div>
                  <div className="text-sm text-gray-600">Your Referral Code</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">${referralData.availableRewards}</div>
                  <div className="text-sm text-gray-600">Available Rewards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{referralData.successfulReferrals}</div>
                  <div className="text-sm text-gray-600">Successful Referrals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              {renderReferrals()}
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              {renderRewards()}
            </TabsContent>
          </Tabs>

          {/* Share Modal */}
          {renderShareModal()}
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default ReferralProgram; 