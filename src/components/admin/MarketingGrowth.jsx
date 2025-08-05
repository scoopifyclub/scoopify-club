'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Users, 
    TrendingUp, 
    Share2, 
    Mail, 
    Search,
    DollarSign,
    Target,
    BarChart3,
    Link,
    Star
} from 'lucide-react';

export default function MarketingGrowth() {
    const [activeTab, setActiveTab] = useState('overview');
    const [referrals, setReferrals] = useState({ scooper: [], business: [] });
    const [emailStats, setEmailStats] = useState({});
    const [seoStats, setSeoStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketingData();
    }, []);

    const fetchMarketingData = async () => {
        try {
            setLoading(true);
            
            // Fetch referral data
            const [scooperRes, businessRes] = await Promise.all([
                fetch('/api/referrals/scooper'),
                fetch('/api/referrals/business')
            ]);

            if (scooperRes.ok) {
                const scooperData = await scooperRes.json();
                setReferrals(prev => ({ ...prev, scooper: scooperData.referrals || [] }));
            }

            if (businessRes.ok) {
                const businessData = await businessRes.json();
                setReferrals(prev => ({ ...prev, business: businessData.referrals || [] }));
            }

            // Mock SEO stats (in production, you'd fetch from Google Analytics, Search Console, etc.)
            setSeoStats({
                organicTraffic: 1250,
                keywordRankings: 45,
                backlinks: 89,
                pageSpeed: 92,
                mobileScore: 95
            });

            // Mock email stats
            setEmailStats({
                totalSent: 1250,
                openRate: 68.5,
                clickRate: 12.3,
                conversionRate: 4.2
            });

        } catch (error) {
            console.error('Error fetching marketing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTotalReferrals = () => {
        return referrals.scooper.length + referrals.business.length;
    };

    const getSuccessfulReferrals = () => {
        const scooperSuccess = referrals.scooper.filter(r => r.status === 'PAID').length;
        const businessSuccess = referrals.business.filter(r => r.status === 'PAID').length;
        return scooperSuccess + businessSuccess;
    };

    const getTotalCommissionPaid = () => {
        const scooperCommission = referrals.scooper
            .filter(r => r.status === 'PAID')
            .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
        const businessCommission = referrals.business
            .filter(r => r.status === 'PAID')
            .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
        return scooperCommission + businessCommission;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Marketing & Growth</h2>
                <Button onClick={fetchMarketingData} variant="outline">
                    Refresh Data
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getTotalReferrals()}</div>
                        <p className="text-xs text-muted-foreground">
                            {getSuccessfulReferrals()} successful conversions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${getTotalCommissionPaid().toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total referral payments
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{emailStats.openRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            Average open rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{seoStats.pageSpeed}/100</div>
                        <p className="text-xs text-muted-foreground">
                            Page speed score
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                    <TabsTrigger value="email">Email Marketing</TabsTrigger>
                    <TabsTrigger value="seo">SEO Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Referral Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Share2 className="h-5 w-5" />
                                    Referral Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Scooper Referrals</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default">{referrals.scooper.length}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ${referrals.scooper
                                                    .filter(r => r.status === 'PAID')
                                                    .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)
                                                    .toFixed(2)} paid
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Business Referrals</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{referrals.business.length}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ${referrals.business
                                                    .filter(r => r.status === 'PAID')
                                                    .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)
                                                    .toFixed(2)} paid
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Campaign Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Email Campaign Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Total Sent</span>
                                        <Badge variant="outline">{emailStats.totalSent}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Open Rate</span>
                                        <Badge variant="default">{emailStats.openRate}%</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Click Rate</span>
                                        <Badge variant="secondary">{emailStats.clickRate}%</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Conversion Rate</span>
                                        <Badge variant="destructive">{emailStats.conversionRate}%</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="referrals" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Scooper Referrals */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Scooper Referrals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {referrals.scooper.slice(0, 5).map((referral) => (
                                        <div key={referral.id} className="border rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{referral.referredName}</span>
                                                <Badge variant={referral.status === 'PAID' ? 'default' : 'secondary'}>
                                                    {referral.status}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p>Email: {referral.referredEmail}</p>
                                                <p>Commission: ${referral.commissionAmount}</p>
                                                <p>Date: {new Date(referral.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Referrals */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Business Referrals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {referrals.business.slice(0, 5).map((referral) => (
                                        <div key={referral.id} className="border rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{referral.referredName}</span>
                                                <Badge variant={referral.status === 'PAID' ? 'default' : 'secondary'}>
                                                    {referral.status}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p>Business: {referral.businessName}</p>
                                                <p>Email: {referral.referredEmail}</p>
                                                <p>Commission: ${referral.commissionAmount}</p>
                                                <p>Date: {new Date(referral.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Email Marketing Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{emailStats.totalSent}</div>
                                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{emailStats.openRate}%</div>
                                    <p className="text-sm text-muted-foreground">Open Rate</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{emailStats.clickRate}%</div>
                                    <p className="text-sm text-muted-foreground">Click Rate</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{emailStats.conversionRate}%</div>
                                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                SEO Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{seoStats.organicTraffic}</div>
                                    <p className="text-sm text-muted-foreground">Organic Traffic</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{seoStats.keywordRankings}</div>
                                    <p className="text-sm text-muted-foreground">Keyword Rankings</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{seoStats.backlinks}</div>
                                    <p className="text-sm text-muted-foreground">Backlinks</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{seoStats.pageSpeed}/100</div>
                                    <p className="text-sm text-muted-foreground">Page Speed</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{seoStats.mobileScore}/100</div>
                                    <p className="text-sm text-muted-foreground">Mobile Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 