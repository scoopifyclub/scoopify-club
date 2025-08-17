'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
    MailIcon, 
    UsersIcon, 
    TrendingUpIcon, 
    TargetIcon, 
    ZapIcon,
    CalendarIcon,
    BarChart3Icon,
    Share2Icon
} from 'lucide-react';

export default function MarketingGrowthPage() {
    const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/login' });
    const [campaigns, setCampaigns] = useState([]);
    const [automations, setAutomations] = useState([]);
    const [referralStats, setReferralStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        subject: '',
        content: '',
        targetAudience: 'all',
        trigger: 'manual',
        status: 'draft'
    });

    useEffect(() => {
        if (status === 'authenticated') {
            fetchMarketingData();
        }
    }, [status]);

    const fetchMarketingData = async () => {
        try {
            setIsLoading(true);
            const [campaignsRes, automationsRes, statsRes] = await Promise.all([
                fetch('/api/admin/marketing/campaigns'),
                fetch('/api/admin/marketing/automations'),
                fetch('/api/admin/referrals/stats')
            ]);

            if (campaignsRes.ok) {
                const campaignsData = await campaignsRes.json();
                setCampaigns(campaignsData.campaigns || []);
            }

            if (automationsRes.ok) {
                const automationsData = await automationsRes.json();
                setAutomations(automationsData.automations || []);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setReferralStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching marketing data:', error);
            toast.error('Failed to load marketing data');
        } finally {
            setIsLoading(false);
        }
    };

    const createCampaign = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/marketing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newCampaign)
            });

            if (response.ok) {
                toast.success('Campaign created successfully');
                setNewCampaign({
                    name: '',
                    subject: '',
                    content: '',
                    targetAudience: 'all',
                    trigger: 'manual',
                    status: 'draft'
                });
                fetchMarketingData();
            } else {
                throw new Error('Failed to create campaign');
            }
        } catch (error) {
            toast.error('Failed to create campaign');
        }
    };

    const toggleAutomation = async (automationId, enabled) => {
        try {
            const response = await fetch(`/api/admin/marketing/automations/${automationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enabled })
            });

            if (response.ok) {
                toast.success(`Automation ${enabled ? 'enabled' : 'disabled'}`);
                fetchMarketingData();
            } else {
                throw new Error('Failed to update automation');
            }
        } catch (error) {
            toast.error('Failed to update automation');
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading marketing dashboard...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Marketing & Growth</h1>
                <p className="text-muted-foreground">
                    Automated marketing campaigns and growth strategies
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
                    <TabsTrigger value="automations">Marketing Automations</TabsTrigger>
                    <TabsTrigger value="referrals">Referral Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                                <MailIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{campaigns.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    {campaigns.filter(c => c.status === 'active').length} active
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
                                <ZapIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {automations.filter(a => a.enabled).length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    of {automations.length} total
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Referral Revenue</CardTitle>
                                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${referralStats.totalRevenue?.toLocaleString() || '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Generated through referrals
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                                <TargetIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {referralStats.conversionRate || '0'}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Referral to customer
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Campaign Performance</CardTitle>
                                <CardDescription>Latest email campaign results</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {campaigns.slice(0, 5).map((campaign) => (
                                        <div key={campaign.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{campaign.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {campaign.status} • {campaign.openRate || 0}% open rate
                                                </p>
                                            </div>
                                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                                {campaign.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Marketing Automations</CardTitle>
                                <CardDescription>Automated marketing workflows</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {automations.slice(0, 5).map((automation) => (
                                        <div key={automation.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{automation.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {automation.trigger} • {automation.targetAudience}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={automation.enabled}
                                                onCheckedChange={(enabled) => toggleAutomation(automation.id, enabled)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Campaign</CardTitle>
                            <CardDescription>Design and schedule email marketing campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={createCampaign} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Campaign Name</Label>
                                        <Input
                                            id="name"
                                            value={newCampaign.name}
                                            onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                            placeholder="Enter campaign name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="targetAudience">Target Audience</Label>
                                        <Select
                                            value={newCampaign.targetAudience}
                                            onValueChange={(value) => setNewCampaign({...newCampaign, targetAudience: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Customers</SelectItem>
                                                <SelectItem value="active">Active Subscribers</SelectItem>
                                                <SelectItem value="inactive">Inactive Customers</SelectItem>
                                                <SelectItem value="new">New Customers</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="subject">Email Subject</Label>
                                    <Input
                                        id="subject"
                                        value={newCampaign.subject}
                                        onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                                        placeholder="Enter email subject"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="content">Email Content</Label>
                                    <Textarea
                                        id="content"
                                        value={newCampaign.content}
                                        onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                                        placeholder="Enter email content (HTML supported)"
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit">Create Campaign</Button>
                                    <Button type="button" variant="outline">Save as Draft</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Campaigns</CardTitle>
                            <CardDescription>Manage and monitor email campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {campaigns.map((campaign) => (
                                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-medium">{campaign.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {campaign.subject} • {campaign.status}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline">Edit</Button>
                                            <Button size="sm" variant="outline">View Stats</Button>
                                            <Button size="sm" variant="destructive">Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="automations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Marketing Automations</CardTitle>
                            <CardDescription>Automated marketing workflows and triggers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {automations.map((automation) => (
                                    <div key={automation.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-medium">{automation.name}</h3>
                                                <Badge variant={automation.enabled ? 'default' : 'secondary'}>
                                                    {automation.enabled ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {automation.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span><CalendarIcon className="h-4 w-4 inline mr-1" />{automation.trigger}</span>
                                                <span><UsersIcon className="h-4 w-4 inline mr-1" />{automation.targetAudience}</span>
                                                <span><BarChart3Icon className="h-4 w-4 inline mr-1" />{automation.performance || '0'}% success</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={automation.enabled}
                                                onCheckedChange={(enabled) => toggleAutomation(automation.id, enabled)}
                                            />
                                            <Button size="sm" variant="outline">Configure</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="referrals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Program Analytics</CardTitle>
                            <CardDescription>Track referral performance and growth</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {referralStats.totalReferrals || '0'}
                                    </div>
                                    <div className="text-sm text-blue-600">Total Referrals</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        ${referralStats.totalRevenue?.toLocaleString() || '0'}
                                    </div>
                                    <div className="text-sm text-green-600">Revenue Generated</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {referralStats.conversionRate || '0'}%
                                    </div>
                                    <div className="text-sm text-purple-600">Conversion Rate</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium">Top Referrers</h3>
                                {referralStats.topReferrers?.map((referrer, index) => (
                                    <div key={referrer.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{index + 1}</Badge>
                                            <div>
                                                <p className="font-medium">{referrer.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {referrer.referrals} referrals
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">${referrer.revenue?.toLocaleString() || '0'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {referrer.commission}% commission
                                            </p>
                                        </div>
                                    </div>
                                )) || (
                                    <p className="text-center text-muted-foreground py-8">
                                        No referral data available
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 