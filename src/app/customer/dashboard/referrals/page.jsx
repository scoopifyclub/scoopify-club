'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CalendarIcon, Share2Icon, DollarSignIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import ReferralCashAppForm from '@/components/ReferralCashAppForm';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerReferralsPage() {
    const { user, loading: authLoading } = useAuth({ 
        requiredRole: 'CUSTOMER',
        redirectTo: '/auth/login?callbackUrl=/customer/dashboard/referrals'
    });

    const [isLoading, setIsLoading] = useState(true);
    const [referralCode, setReferralCode] = useState('');
    const [referrals, setReferrals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [cashAppName, setCashAppName] = useState(null);
    const [savingCashApp, setSavingCashApp] = useState(false);
    const [stats, setStats] = useState({
        totalEarned: 0,
        activeReferrals: 0,
        monthlyEstimate: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                setIsLoading(true);

                const [customerData, cashAppData, referralsData, paymentsData] = await Promise.all([
                    // Fetch referral code
                    fetch('/api/customer/referral-code').then(res => {
                        if (!res.ok) throw new Error('Failed to fetch referral code');
                        return res.json();
                    }),
                    // Fetch Cash App info
                    fetch('/api/customer/cash-app-info').then(res => {
                        if (!res.ok) return null;
                        return res.json();
                    }),
                    // Fetch referrals
                    fetch('/api/customer/referrals').then(res => {
                        if (!res.ok) throw new Error('Failed to fetch referrals');
                        return res.json();
                    }),
                    // Fetch payments
                    fetch('/api/customer/referral-payments').then(res => {
                        if (!res.ok) throw new Error('Failed to fetch referral payments');
                        return res.json();
                    })
                ]);

                setReferralCode(customerData.referralCode);
                if (cashAppData) {
                    setCashAppName(cashAppData.cashAppName);
                }
                setReferrals(referralsData.referrals);
                setPayments(paymentsData.payments);

                // Calculate stats
                const activeReferrals = referralsData.referrals.filter((r) => r.isActive).length;
                const totalEarned = paymentsData.payments.reduce((sum, p) => sum + p.amount, 0);
                const monthlyEstimate = activeReferrals * 5; // $5 per active referral per month

                setStats({
                    totalEarned,
                    activeReferrals,
                    monthlyEstimate
                });
            } catch (error) {
                console.error('Error fetching referral data:', error);
                toast.error('Failed to load some referral data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        toast.success('Referral code copied to clipboard');
    };

    const shareReferral = async () => {
        const shareText = `Join ScoopifyClub for pet waste removal services! Use my referral code: ${referralCode} to sign up. https://scoopifyclub.com/signup?ref=${referralCode}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join ScoopifyClub',
                    text: shareText,
                    url: `https://scoopifyclub.com/signup?ref=${referralCode}`
                });
            } catch (error) {
                navigator.clipboard.writeText(shareText);
                toast.success('Share text copied to clipboard');
            }
        } else {
            navigator.clipboard.writeText(shareText);
            toast.success('Share text copied to clipboard');
        }
    };

    const handleUpdateCashApp = async (newCashAppName) => {
        try {
            setSavingCashApp(true);
            const response = await fetch('/api/customer/cash-app-info', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cashAppName: newCashAppName }),
            });

            if (!response.ok) {
                throw new Error('Failed to update Cash App information');
            }

            setCashAppName(newCashAppName);
            toast.success('Cash App information updated successfully');
        } catch (error) {
            console.error('Error updating Cash App:', error);
            toast.error('Failed to update Cash App information');
        } finally {
            setSavingCashApp(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
                <p className="text-sm text-gray-500">
                    Earn $5 per month for each active customer you refer!
                </p>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                            <Users className="h-4 w-4 mr-2 text-primary"/>
                            Active Referrals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.activeReferrals}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                            <DollarSignIcon className="h-4 w-4 mr-2 text-primary"/>
                            Total Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">${stats.totalEarned.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                            <CalendarIcon className="h-4 w-4 mr-2 text-primary"/>
                            Monthly Estimate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">${stats.monthlyEstimate.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Referral Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                            <Input value={referralCode} readOnly className="font-mono"/>
                            <Button onClick={copyReferralCode}>Copy</Button>
                        </div>
                        <Button onClick={shareReferral} variant="outline" className="w-full">
                            <Share2Icon className="h-4 w-4 mr-2"/>
                            Share with Friends
                        </Button>
                    </CardContent>
                </Card>

                <ReferralCashAppForm 
                    cashAppName={cashAppName} 
                    onSubmit={handleUpdateCashApp} 
                    loading={savingCashApp}
                />
            </div>

            <Tabs defaultValue="referrals">
                <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="referrals">Your Referrals</TabsTrigger>
                    <TabsTrigger value="payments">Payment History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="referrals" className="space-y-4">
                    {referrals.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">You haven't referred anyone yet.</p>
                            <p className="text-gray-400 text-sm mt-2">Share your referral code to start earning!</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Referred</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {referrals.map((referral) => (
                                            <tr key={referral.id}>
                                                <td className="px-4 py-4 text-sm">{referral.referredName}</td>
                                                <td className="px-4 py-4 text-sm">{referral.referredEmail}</td>
                                                <td className="px-4 py-4 text-sm">
                                                    {format(new Date(referral.dateReferred), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                                        referral.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {referral.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    {payments.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No payments yet.</p>
                            <p className="text-gray-400 text-sm mt-2">
                                Payments will appear here once your referrals become active.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="px-4 py-4 text-sm">
                                                    {format(new Date(payment.date), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    ${payment.amount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                                        payment.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : payment.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm">{payment.method}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
