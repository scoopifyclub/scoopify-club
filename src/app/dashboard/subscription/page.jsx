'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CustomerDashboardLayout } from '@/components/layouts/CustomerDashboardLayout';
import { Calendar, CreditCard, CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';

export default function SubscriptionPage() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [servicePlans, setServicePlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [preferredDay, setPreferredDay] = useState('');
    const [router] = useState(useRouter());

    const daysOfWeek = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    useEffect(() => {
        fetchSubscriptionData();
        fetchServicePlans();
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            const response = await fetch('/api/customer/subscription', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSubscription(data.subscription);
                if (data.customer?.serviceDay) {
                    setPreferredDay(data.customer.serviceDay);
                }
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServicePlans = async () => {
        try {
            const response = await fetch('/api/services/plans');
            if (response.ok) {
                const data = await response.json();
                // Filter out the Initial Cleanup plan from monthly options
                const monthlyPlans = data.plans?.filter(plan => plan.type !== 'INITIAL_CLEANUP') || [];
                setServicePlans(monthlyPlans);
            }
        } catch (error) {
            console.error('Error fetching service plans:', error);
        }
    };

    const handlePlanSelection = (plan) => {
        setSelectedPlan(plan);
    };

    const handlePreferredDayChange = (day) => {
        setPreferredDay(day);
    };

    const handleSubscribe = async () => {
        if (!selectedPlan || !preferredDay) {
            toast.error('Please select a plan and preferred service day');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/customer/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    planId: selectedPlan.id,
                    preferredDay: preferredDay
                })
            });

            if (response.ok) {
                toast.success('Subscription created successfully!');
                await fetchSubscriptionData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to create subscription');
            }
        } catch (error) {
            console.error('Error creating subscription:', error);
            toast.error('Failed to create subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePreferences = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/customer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    serviceDay: preferredDay
                })
            });

            if (response.ok) {
                toast.success('Preferences updated successfully!');
            } else {
                toast.error('Failed to update preferences');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast.error('Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <CustomerDashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-600 font-medium">Loading subscription...</p>
                    </div>
                </div>
            </CustomerDashboardLayout>
        );
    }

    return (
        <CustomerDashboardLayout>
            <div className="min-h-screen bg-neutral-50">
                <main className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Subscription Management</h1>
                        <p className="text-neutral-600 mt-2">Manage your monthly service plan and preferences</p>
                    </div>

                    {/* Current Subscription Status */}
                    {subscription && (
                        <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-green-800 mb-2">
                                        Active Subscription
                                    </h2>
                                    <div className="space-y-2 text-green-700">
                                        <p><strong>Status:</strong> {subscription.status}</p>
                                        <p><strong>Started:</strong> {new Date(subscription.startDate).toLocaleDateString()}</p>
                                        <p><strong>Service Credits:</strong> {subscription.serviceCredits || 0} remaining</p>
                                        <p><strong>Preferred Day:</strong> {subscription.preferredDay || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-600">
                                        {subscription.serviceCredits || 0}
                                    </div>
                                    <p className="text-green-600">Credits Left</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Important Notice */}
                    <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-blue-800 mb-2">New Customer? Initial Cleanup Required</h3>
                                <p className="text-blue-700 mb-3">
                                    All new customers need an initial cleanup service ($89) to prepare their yard for weekly maintenance. 
                                    This initial cleanup gives you 1 service credit, plus your monthly plan gives you 4 additional credits.
                                </p>
                                <div className="bg-white p-3 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        <strong>Credit Structure:</strong> 1 credit from initial cleanup + 4 credits from monthly plan = 5 total credits
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Service Plans */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-6">Choose Your Monthly Service Plan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {servicePlans.map((plan) => (
                                <Card 
                                    key={plan.id} 
                                    className={`p-6 cursor-pointer transition-all ${
                                        selectedPlan?.id === plan.id 
                                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                                            : 'hover:shadow-lg'
                                    }`}
                                    onClick={() => handlePlanSelection(plan)}
                                >
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                        <p className="text-gray-600 mb-4">{plan.description}</p>
                                        <div className="text-3xl font-bold text-blue-600 mb-2">
                                            ${plan.price}
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">per month</p>
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                <span>4 weekly service credits</span>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-blue-500 mr-2" />
                                                <span>{plan.duration} min service</span>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-purple-500 mr-2" />
                                                <span>Flexible scheduling</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Preferred Service Day */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-6">Preferred Service Day</h2>
                        <Card className="p-6">
                            <p className="text-gray-600 mb-4">
                                Choose your preferred day of the week for services. You can reschedule up to 3 days in either direction.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                {daysOfWeek.map((day) => (
                                    <Button
                                        key={day.value}
                                        variant={preferredDay === day.value ? "default" : "outline"}
                                        className="h-12"
                                        onClick={() => handlePreferredDayChange(day.value)}
                                    >
                                        {day.label}
                                    </Button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {!subscription ? (
                            <Button 
                                onClick={handleSubscribe}
                                disabled={!selectedPlan || !preferredDay || loading}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Start Subscription
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleUpdatePreferences}
                                disabled={loading}
                                variant="outline"
                                className="flex-1"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Update Preferences
                            </Button>
                        )}
                        
                        <Button 
                            onClick={() => router.push('/dashboard/schedule')}
                            variant="outline"
                            className="flex-1"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Service
                        </Button>
                    </div>

                    {/* How It Works */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold mb-2">1. Initial Setup</h3>
                                <p className="text-gray-600">Pay $89 for initial cleanup (gives 1 credit) + monthly plan fee (gives 4 credits)</p>
                            </Card>
                            
                            <Card className="p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="font-semibold mb-2">2. Weekly Services</h3>
                                <p className="text-gray-600">Use your 5 total credits for weekly services on your preferred day</p>
                            </Card>
                            
                            <Card className="p-6 text-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="font-semibold mb-2">3. Job Release</h3>
                                <p className="text-gray-600">Jobs are released at 8 AM for scoopers to claim</p>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </CustomerDashboardLayout>
    );
}
