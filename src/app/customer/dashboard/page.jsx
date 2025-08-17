'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { toast } from 'sonner';
import { Calendar, CreditCard, User, Clock, DollarSign, MapPin, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PaymentInfoReminder from '@/components/PaymentInfoReminder';
import CustomerPaymentAlert from '@/components/CustomerPaymentAlert';
export default function CustomerDashboard() {
    var _a, _b, _c, _d, _e, _f, _g;
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [showPaymentAlert, setShowPaymentAlert] = useState(false);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [formData, setFormData] = useState({
        phone: '',
        gateCode: '',
        serviceDay: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
        preferences: {
            specialInstructions: '',
            gateLocation: '',
        },
    });
    const [fetchedAt, setFetchedAt] = useState(null);
    
    // Listen for tab changes more aggressively
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'dashboard_active_tab' && event.newValue) {
                setActiveTab(event.newValue);
            }
        };
        
        // Custom event listener for direct communication
        const handleTabChange = (event) => {
            if (event.detail && event.detail.tab) {
                setActiveTab(event.detail.tab);
            }
        };
        
        if (typeof window !== 'undefined') {
            // Check URL parameter on mount and when URL changes
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            if (tabParam && ['overview', 'services', 'billing', 'profile'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
            
            // Also check localStorage
            const storedTab = localStorage.getItem('dashboard_active_tab');
            if (storedTab && ['overview', 'services', 'billing', 'profile'].includes(storedTab)) {
                setActiveTab(storedTab);
            }
            
            // Add event listeners
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('dashboardTabChange', handleTabChange);
            
            // Poll for changes as a fallback
            const interval = setInterval(() => {
                const currentTab = localStorage.getItem('dashboard_active_tab');
                if (currentTab && currentTab !== activeTab) {
                    setActiveTab(currentTab);
                }
            }, 500);
            
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('dashboardTabChange', handleTabChange);
                clearInterval(interval);
            };
        }
    }, [activeTab]);
    
    const getAccessToken = () => {
        // Try to get token from cookies first
        const cookies = document.cookie.split(';');
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
        let token = accessTokenCookie ? accessTokenCookie.split('=')[1].trim() : '';
        
        // If still no token, make a session check request
        if (!token) {
            // Token not found, will use server-side session check
        }
        return token;
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                // First check the session directly from the server
                const sessionResponse = await fetch('/api/auth/session', {
                    credentials: 'include' // Important for sending cookies
                }).catch(err => {
                    console.error('Fetch error for session check:', err);
                    throw new Error('Network error during session check');
                });
                
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    
                    if (!sessionData.user) {
                        throw new Error('Session is valid but no user data returned');
                    }
                    
                    if (sessionData.user.role !== 'CUSTOMER') {
                        throw new Error(`You don't have permission to access the customer dashboard. Your role is: ${sessionData.user.role}`);
                    }
                    
                    // If we get a valid session response, continue with requests
                    await loadDashboardData();
                    setLoading(false); // Ensure loading is set to false after data is loaded
                } else {
                    // Try to get error details
                    try {
                        const errorData = await sessionResponse.json();
                        throw new Error(errorData.error || 'Session check failed');
                    } catch (parseError) {
                        throw new Error('Session check failed');
                    }
                }
            } catch (err) {
                console.error('Authentication error:', err);
                
                // Try to refresh the token
                try {
                    const refreshResponse = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    if (refreshResponse.ok) {
                        // Token refresh successful, retry
                        await fetchData();
                        return;
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                }
                
                // If all else fails, redirect to login
                router.push('/login');
            }
        };
        
        fetchData();
    }, []);
    const loadDashboardData = async () => {
        console.log('loadDashboardData started');
        const headers = {
            'Content-Type': 'application/json'
        };
        try {
            // Fetch customer profile first to get address info
            console.log('About to fetch customer profile');
            const customerRes = await fetch('/api/customer/profile', {
                headers,
                credentials: 'include'
            });
            console.log('Customer profile response status:', customerRes.status);
            if (customerRes.ok) {
                const customerData = await customerRes.json();
                console.log('Fetched customer data:', customerData);
                setCustomer(customerData);
                // Update form data with customer profile
                if (customerData) {
                    setFormData({
                        phone: customerData.phone || '',
                        gateCode: customerData.gateCode || '',
                        serviceDay: customerData.serviceDay || '',
                        address: customerData.address || {
                            street: '',
                            city: '',
                            state: '',
                            zipCode: '',
                        },
                        preferences: customerData.preferences || {
                            specialInstructions: '',
                            gateLocation: '',
                        },
                    });
                }
                // Save fetch timestamp
                setFetchedAt(new Date().toLocaleString());
            }
            else {
                console.error('Failed to fetch customer profile:', customerRes.status);
                // Try to get error details
                try {
                    const errorData = await customerRes.json();
                }
                catch (e) {
                }
                // If it's a 401, try to refresh the token
                if (customerRes.status === 401) {
                    const refreshResponse = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (refreshResponse.ok) {
                        window.location.reload();
                        return;
                    }
                    else {
                        router.push('/login');
                        return;
                    }
                }
                // For other errors, continue loading what we can
            }
            // Fetch services
            console.log('About to fetch customer services');
            const servicesRes = await fetch('/api/customer/services', {
                headers,
                credentials: 'include'
            });
            console.log('Services API response status:', servicesRes.status);
            if (!servicesRes.ok) {
                const errorData = await servicesRes.json().catch(() => ({}));
                console.error('Services API error:', errorData);
                throw new Error('Failed to fetch services');
            }
            const servicesData = await servicesRes.json();
            console.log('Services data:', servicesData);
            setServices(Array.isArray(servicesData) ? servicesData : []);
            // Fetch subscription
            console.log('About to fetch customer subscription');
            const subscriptionRes = await fetch('/api/customer/subscription', {
                headers,
                credentials: 'include'
            });
            console.log('Subscription API response status:', subscriptionRes.status);
            if (subscriptionRes.ok) {
                const subscriptionData = await subscriptionRes.json();
                console.log('Subscription data:', subscriptionData);
                setSubscription(subscriptionData);
            }
            else if (subscriptionRes.status === 404) {
                // Handle case where no subscription exists (demo account)
                console.log('No subscription found (404), setting to null');
                setSubscription(null);
            }
            else {
                const errorData = await subscriptionRes.json().catch(() => ({}));
                console.error('Subscription API error:', errorData);
                console.error('Failed to fetch subscription:', errorData);
                // Don't throw here since subscription is optional
            }
            // Fetch payments
            console.log('About to fetch customer payments');
            const paymentsRes = await fetch('/api/customer/payments', {
                headers,
                credentials: 'include'
            });
            console.log('Payments API response status:', paymentsRes.status);
            if (!paymentsRes.ok) {
                const errorData = await paymentsRes.json().catch(() => ({}));
                console.error('Payments API error:', errorData);
                throw new Error('Failed to fetch payments');
            }
            const paymentsData = await paymentsRes.json();
            console.log('Payments data:', paymentsData);
            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
            console.log('All data loaded successfully');
            // Force loading to false here just to be extra sure
            setTimeout(() => {
                console.log('Forcing loading state to false');
                setLoading(false);
            }, 500);
        }
        catch (err) {
            console.error("Error in loadDashboardData:", err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            setLoading(false);
            throw err;
        }
    };
    const handleUpdateProfile = async (updatedData) => {
        try {
            console.log('Updating profile with data:', updatedData);
            // Prepare the request data, only including fields that are provided
            const requestData = {};
            // Add specific fields if they're in the updated data
            if (updatedData.phone !== undefined)
                requestData.phone = updatedData.phone;
            if (updatedData.gateCode !== undefined)
                requestData.gateCode = updatedData.gateCode;
            if (updatedData.serviceDay !== undefined)
                requestData.serviceDay = updatedData.serviceDay;
            // Handle address separately to avoid sending undefined
            if (updatedData.address) {
                requestData.address = {};
                if (updatedData.address.street !== undefined)
                    requestData.address.street = updatedData.address.street;
                if (updatedData.address.city !== undefined)
                    requestData.address.city = updatedData.address.city;
                if (updatedData.address.state !== undefined)
                    requestData.address.state = updatedData.address.state;
                if (updatedData.address.zipCode !== undefined)
                    requestData.address.zipCode = updatedData.address.zipCode;
            }
            console.log('Sending request with data:', requestData);
            const response = await fetch('/api/customer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                credentials: 'include',
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Profile update error:', errorData);
                throw new Error(errorData.error || 'Failed to update profile');
            }
            const updatedCustomer = await response.json();
            setCustomer(updatedCustomer);
            toast.success('Profile updated successfully');
        }
        catch (error) {
            console.error('Profile update error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
        }
    };
    const handleScheduleService = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                toast.error('Not authenticated. Please log in again.');
                router.push('/login');
                return;
            }
            const response = await fetch('/api/customer/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    scheduledFor: new Date().toISOString(),
                    preferences: formData.preferences,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to schedule service');
            }
            const newService = await response.json();
            setServices([...services, newService]);
            toast.success('Service scheduled successfully');
        }
        catch (err) {
            console.error('Schedule error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to schedule service');
            if (err instanceof Error && err.message.includes('401')) {
                router.push('/login');
            }
        }
    };
    const handleCancelSubscription = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                toast.error('Not authenticated. Please log in again.');
                router.push('/login');
                return;
            }
            const response = await fetch('/api/subscriptions', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                credentials: 'include', // Include cookies
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel subscription');
            }
            const updatedSubscription = await response.json();
            setSubscription(updatedSubscription);
            toast.success('Subscription cancelled successfully');
        }
        catch (err) {
            console.error('Cancel subscription error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription');
            if (err instanceof Error && err.message.includes('401')) {
                router.push('/login');
            }
        }
    };
    const handlePauseService = async (serviceId) => {
        try {
            const response = await fetch(`/api/customer/services/${id}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to pause service');
            }
            const updatedService = await response.json();
            setServices(services.map(s => s.id === serviceId ? updatedService : s));
            toast.success('Service paused successfully');
        }
        catch (error) {
            toast.error('Failed to pause service');
        }
    };
    const handleCancelService = async (serviceId) => {
        if (!confirm('Are you sure you want to cancel this service?')) {
            return;
        }
        try {
            const response = await fetch(`/api/customer/services/${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to cancel service');
            }
            const updatedService = await response.json();
            setServices(services.map(s => s.id === serviceId ? updatedService : s));
            toast.success('Service cancelled successfully');
        }
        catch (error) {
            toast.error('Failed to cancel service');
        }
    };
    const handleChoosePlan = () => {
        // Navigate to the pricing page for plan selection
        router.push('/pricing');
    };
    const handleUpdatePaymentMethod = async (cardDetails) => {
        try {
            const response = await fetch('/api/customer/payment-method', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardDetails),
            });
            if (!response.ok) {
                throw new Error('Failed to update payment method');
            }
            toast.success('Payment method updated successfully');
        }
        catch (error) {
            toast.error('Failed to update payment method');
        }
    };
    const handleUpdateCashAppName = async (cashAppName) => {
        try {
            const response = await fetch('/api/customer/cashapp', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cashAppName }),
            });
            if (!response.ok) {
                throw new Error('Failed to update Cash App name');
            }
            setCustomer(Object.assign(Object.assign({}, customer), { cashAppName }));
            toast.success('Cash App name updated successfully');
        }
        catch (error) {
            toast.error('Failed to update Cash App name');
        }
    };
    const handleManageSubscription = async () => {
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                const { url } = await response.json();
                window.open(url, '_blank');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to open subscription manager');
            }
        } catch (error) {
            console.error('Error opening subscription manager:', error);
            toast.error('Failed to open subscription manager');
        }
    };

    const handleSetupPaymentMethod = async () => {
        try {
            const response = await fetch('/api/stripe/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                const { clientSecret } = await response.json();
                // In a real app, you would use Stripe.js to collect payment method
                // For now, redirect to Stripe portal
                toast.info('Redirecting to Stripe to set up payment method...');
                setTimeout(() => {
                    handleStripeCustomerPortal();
                }, 1000);
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to set up payment method');
            }
        } catch (error) {
            console.error('Error setting up payment method:', error);
            toast.error('Failed to set up payment method');
        }
    };

    const handleStripeCustomerPortal = async () => {
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                const { url } = await response.json();
                window.open(url, '_blank');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to open Stripe portal');
            }
        } catch (error) {
            console.error('Error opening Stripe portal:', error);
            toast.error('Failed to open Stripe portal');
        }
    };
    // Function to navigate to a tab using the layout's mechanism
    const navigateToTab = (tab) => {
        if (typeof window !== 'undefined') {
            // Update localStorage and dispatch event to notify layout
            localStorage.setItem('dashboard_active_tab', tab);
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'dashboard_active_tab',
                newValue: tab,
                storageArea: localStorage
            }));
            // Also update URL for direct navigation
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.pushState({}, '', url);
            // Update local state for immediate UI response
            setActiveTab(tab);
        }
    };
    console.log('Current active tab:', activeTab);
    // Dashboard loading state
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>);
    }
    // Dashboard error state
    if (error) {
        return (<div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
            Try Again
          </Button>
        </div>
      </div>);
    }
    // No customer data found state
    if (!customer) {
        return (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-lg text-yellow-700 max-w-md">
          <h3 className="text-xl font-bold mb-4">No Customer Data Found</h3>
          <p className="mb-4">We couldn't load your customer profile. This may be due to:</p>
          <ul className="text-left list-disc pl-5 mb-4">
            <li>Your session has expired</li>
            <li>You need to complete your profile</li>
            <li>There was a server-side error</li>
          </ul>
          <div className="bg-yellow-100 p-4 rounded mb-4 text-left text-sm overflow-auto max-h-40 whitespace-pre-wrap">
            <strong>Debug info:</strong><br />
            {/* authDebug removed */}
          </div>
          <div className="mt-6 flex flex-col space-y-2">
            <button onClick={() => window.location.reload()} className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
              Try Again
            </button>
            <button onClick={() => router.push('/login')} className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
              Return to Login
            </button>
          </div>
        </div>
      </div>);
    }
    console.log('Current active tab:', activeTab);
    // Dashboard metrics
    const metrics = [
        {
            title: "Preferred Service Day",
            value: (customer === null || customer === void 0 ? void 0 : customer.serviceDay) || "Not set",
            icon: Calendar,
            color: "text-blue-500"
        },
        {
            title: "Last Service",
            value: services.length > 0
                ? (() => {
                    try {
                        const lastService = services[services.length - 1];
                        const date = lastService.scheduledDate || lastService.scheduledFor;
                        return format(new Date(date), 'MMM d, yyyy');
                    }
                    catch (error) {
                        console.error('Error formatting date:', error);
                        return "Date unavailable";
                    }
                })()
                : "No services yet",
            icon: Clock,
            color: "text-green-500"
        },
        {
            title: "Active Subscription",
            value: subscription ? subscription.plan.name : "No active subscription",
            icon: CreditCard,
            color: "text-purple-500"
        },
        {
            title: "Current Address",
            value: (customer === null || customer === void 0 ? void 0 : customer.address) ? `${customer.address.city}, ${customer.address.state}` : "Not set",
            icon: MapPin,
            color: "text-red-500"
        }
    ];
    // Main dashboard content
    return (<div key={activeTab} className="space-y-8">
      {/* Debug info section - only shown in development */}
      {process.env.NODE_ENV === 'development' && (<div className="bg-blue-50 text-blue-800 p-2 text-xs rounded mb-4">
          <div><strong>Active Tab:</strong> {activeTab}</div>
          <div><strong>Fetched At:</strong> {fetchedAt}</div>
          <div><strong>Customer ID:</strong> {customer === null || customer === void 0 ? void 0 : customer.id}</div>
          <div><strong>Services:</strong> {services.length}</div>
          <div><strong>Subscription:</strong> {subscription ? 'Active' : 'None'}</div>
          <div><strong>Payments:</strong> {payments.length}</div>
          <div className="mt-1"><strong>API Status:</strong></div>
          {/* authDebug removed */}
        </div>)}
      
      {/* Payment Info Reminder */}
      {customer && !customer.hasPaymentInfo && (<PaymentInfoReminder userType="customer" hasPaymentInfo={customer.hasPaymentInfo}/>)}
      
      {/* Service Credits - Always Visible */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">Service Credits</h2>
                  <p className="text-blue-700">Available services remaining</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-900">{customer?.serviceCredits || 0}</div>
                <div className="text-blue-600 font-medium">Credits Available</div>
                {customer?.serviceCredits > 0 ? (
                  <div className="text-sm text-blue-500 mt-1">
                    {customer.serviceCredits === 1 ? '1 service remaining' : `${customer.serviceCredits} services remaining`}
                  </div>
                ) : (
                  <div className="text-sm text-red-500 mt-1">No credits remaining</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigateToTab('services')}
              >
                <Calendar className="w-6 h-6" />
                <span>View Services</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigateToTab('profile')}
              >
                <User className="w-6 h-6" />
                <span>Edit Profile</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigateToTab('billing')}
              >
                <CreditCard className="w-6 h-6" />
                <span>Billing</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'overview' && (
        // Overview tab content
        <>
          <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
          
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (<Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">{metric.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full bg-gray-100 mr-3 ${metric.color}`}>
                      <metric.icon className="w-5 h-5"/>
                    </div>
                    <div className="text-xl font-bold">{metric.value}</div>
                  </div>
                </CardContent>
              </Card>))}
          </div>
          
          {/* Recent Service Photos */}
          {services.length > 0 && (<Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Service Photos</CardTitle>
                <CardDescription>Photos from your last service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services[services.length - 1].photos && services[services.length - 1].photos.length > 0 ? (services[services.length - 1].photos.map((photo) => (<div key={photo.id} className="relative aspect-square">
                        <Image src={photo.url} alt={`${photo.type} service photo`} fill className="object-cover rounded-lg"/>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                          {photo.type === 'BEFORE' ? 'Before Service' : 'After Service'}
                        </div>
                      </div>))) : (<div className="text-center py-8">
                      <Camera className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                      <p className="text-gray-500">No photos available from last service</p>
                    </div>)}
                </div>
              </CardContent>
            </Card>)}
          
          {/* Upcoming Services */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
              <CardDescription>Your next scheduled visits</CardDescription>
            </CardHeader>
            <CardContent>
              {services.filter(s => s.status === 'SCHEDULED').length > 0 ? (<div className="space-y-4">
                  {services
                    .filter(s => s.status === 'SCHEDULED')
                    .slice(0, 3)
                    .map((service) => (<div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-blue-500 mr-3"/>
                          <div>
                            {(() => {
                        try {
                            const date = service.scheduledDate || service.scheduledFor;
                            return (<>
                                    <p className="font-medium">{format(new Date(date), 'MMMM d, yyyy')}</p>
                                    <p className="text-sm text-gray-500">{format(new Date(date), 'h:mm a')}</p>
                                  </>);
                        }
                        catch (error) {
                            console.error('Error formatting service date:', error);
                            return (<>
                                    <p className="font-medium">Date unavailable</p>
                                    <p className="text-sm text-gray-500">Time unavailable</p>
                                  </>);
                        }
                    })()}
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {service.status}
                        </Badge>
                      </div>))}
                    
                  <Button variant="outline" className="w-full mt-2" onClick={() => navigateToTab('services')}>
                    View All Services
                  </Button>
                </div>) : (<div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                  <p className="text-gray-500">No upcoming services scheduled</p>
                  <Button className="mt-4" onClick={() => navigateToTab('services')}>
                    Schedule a Service
                  </Button>
                </div>)}
            </CardContent>
          </Card>
          
          {/* Subscription Status */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>Your current plan details</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (<div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-lg">{((_a = subscription.plan) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Plan'}</p>
                      <p className="text-gray-500">
                        ${((_b = subscription.plan) === null || _b === void 0 ? void 0 : _b.price) || '0.00'}/{((_c = subscription.plan) === null || _c === void 0 ? void 0 : _c.frequency) || 'month'}
                      </p>
                    </div>
                    <Badge className={subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    subscription.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}>
                      {subscription.status || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Next billing date</span>
                    <span className="font-medium">
                      {(() => {
                    try {
                        // Check if nextBillingDate exists and is valid
                        if (!subscription.nextBillingDate) {
                            return "Not available";
                        }
                        // Try parsing the date
                        const date = new Date(subscription.nextBillingDate);
                        // Check if the date is valid
                        if (isNaN(date.getTime())) {
                            throw new Error('Invalid date');
                        }
                        return format(date, 'MMMM d, yyyy');
                    }
                    catch (error) {
                        console.error('Error formatting billing date:', error, 'Date value:', subscription.nextBillingDate);
                        return "Date unavailable";
                    }
                })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start date</span>
                    <span className="font-medium">
                      {(() => {
                    try {
                        // Check if startDate exists and is valid
                        if (!subscription.startDate) {
                            return "Not available";
                        }
                        // Try parsing the date
                        const date = new Date(subscription.startDate);
                        // Check if the date is valid
                        if (isNaN(date.getTime())) {
                            throw new Error('Invalid date');
                        }
                        return format(date, 'MMMM d, yyyy');
                    }
                    catch (error) {
                        console.error('Error formatting start date:', error, 'Date value:', subscription.startDate);
                        return "Date unavailable";
                    }
                })()}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full mt-2" onClick={() => navigateToTab('billing')}>
                    Manage Subscription
                  </Button>
                </div>) : (<div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                  <p className="text-gray-500">No active subscription found</p>
                  <Button className="mt-4" onClick={handleChoosePlan}>
                    Choose a Plan
                  </Button>
                </div>)}
            </CardContent>
          </Card>
        </>)}

      {activeTab === 'services' && (
        // Services tab content
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Services</h1>
            <Button onClick={() => handleScheduleService()}>
              Schedule New Service
            </Button>
          </div>

          <div className="space-y-6">
            {services.map((service) => {
                var _a;
                return (<Card key={service.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{service.type || 'Service'}</span>
                    <Badge variant={service.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                      {service.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {(() => {
                        try {
                            const date = service.scheduledDate || service.scheduledFor;
                            return `Scheduled for ${format(new Date(date), 'MMMM d, yyyy')}`;
                        }
                        catch (error) {
                            console.error('Error formatting service date:', error);
                            return 'Schedule date unavailable';
                        }
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4"/>
                        <span>{((_a = service.employee) === null || _a === void 0 ? void 0 : _a.name) || 'No employee assigned'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4"/>
                        <span>${service.amount || '0.00'}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      {service.status === 'SCHEDULED' && (<>
                          <Button variant="outline" onClick={() => handlePauseService(service.id)} disabled={service.isPaused}>
                            {service.isPaused ? 'Service Paused' : 'Pause Service'}
                          </Button>
                          <Button variant="destructive" onClick={() => handleCancelService(service.id)}>
                            Cancel Service
                          </Button>
                        </>)}
                    </div>
                  </div>
                </CardContent>
              </Card>);
            })}
            {services.length === 0 && (<Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                  <p className="text-gray-500">No services found</p>
                  <Button className="mt-4" onClick={() => handleScheduleService()}>
                    Schedule Your First Service
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </>)}

            {activeTab === 'billing' && (
        // Billing tab content
        <>
          <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
          
          {/* Current Subscription Status */}
          {subscription && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your recurring service plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-lg">{subscription.plan?.name || 'Service Plan'}</p>
                      <p className="text-gray-500">
                        ${subscription.plan?.price || '0.00'}/{subscription.plan?.frequency || 'month'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Next billing: {(() => {
                          try {
                            if (!subscription.nextBilling) return "Not available";
                            const date = new Date(subscription.nextBilling);
                            if (isNaN(date.getTime())) return "Date unavailable";
                            return format(date, 'MMMM d, yyyy');
                          } catch (error) {
                            return "Date unavailable";
                          }
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {subscription.status || 'UNKNOWN'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        onClick={() => handleManageSubscription()}
                        className="flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Manage
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium">{subscription.status || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-medium">
                      {(() => {
                        try {
                          if (!subscription.startDate) return "Not available";
                          const date = new Date(subscription.startDate);
                          if (isNaN(date.getTime())) return "Date unavailable";
                          return format(date, 'MMM d, yyyy');
                        } catch (error) {
                          return "Date unavailable";
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment information for recurring charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer?.stripeCustomerId ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4"/>
                      <span>Payment method configured</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleUpdatePaymentMethod()}
                      >
                        Update Card
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleStripeCustomerPortal()}
                      >
                        Manage in Stripe
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3">No payment method configured</p>
                    <Button onClick={() => handleSetupPaymentMethod()}>
                      Set Up Payment Method
                    </Button>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
                  <p>💳 Your payment method is securely stored with Stripe and will be automatically charged for your recurring service.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">${payment.amount || '0.00'}</p>
                        <p className="text-sm text-gray-500">
                          {(() => {
                            try {
                              return format(new Date(payment.createdAt), 'MMMM d, yyyy');
                            } catch (error) {
                              console.error('Error formatting payment date:', error);
                              return 'Date unavailable';
                            }
                          })()}
                        </p>
                        <p className="text-xs text-gray-400">{payment.type || 'Payment'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={payment.status === 'PAID' || payment.status === 'COMPLETED' ? 'default' : 'destructive'}>
                          {payment.status}
                        </Badge>
                        {payment.receiptUrl && (
                          <Button variant="outline" size="sm" onClick={() => window.open(payment.receiptUrl, '_blank')}>
                            Download Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2"/>
                    <p className="text-gray-500">No billing history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Program */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>Share your referral code and earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Your Referral Code</p>
                    <p className="text-sm text-gray-500">Share this code with friends</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-3 py-1 bg-gray-100 rounded">{customer?.referralCode}</code>
                    <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(customer?.referralCode || '');
                        toast.success('Referral code copied to clipboard');
                    }}>
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cash App Name</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customer?.cashAppName || ''}
                      onChange={(e) => setCustomer({...customer, cashAppName: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Enter your Cash App name"
                    />
                    <Button onClick={() => handleUpdateCashAppName(customer?.cashAppName || '')}>
                      Save
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter your Cash App name to receive referral rewards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'profile' && (
        // Profile tab content
        <>
          <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
          
          {/* Address Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Update your service address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Street Address</label>
                    <input type="text" value={((_d = customer === null || customer === void 0 ? void 0 : customer.address) === null || _d === void 0 ? void 0 : _d.street) || ''} onChange={(e) => setCustomer(Object.assign(Object.assign({}, customer), { address: Object.assign(Object.assign({}, customer === null || customer === void 0 ? void 0 : customer.address), { street: e.target.value }) }))} className="w-full px-3 py-2 border rounded-md" placeholder="Enter street address"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <input type="text" value={((_e = customer === null || customer === void 0 ? void 0 : customer.address) === null || _e === void 0 ? void 0 : _e.city) || ''} onChange={(e) => setCustomer(Object.assign(Object.assign({}, customer), { address: Object.assign(Object.assign({}, customer === null || customer === void 0 ? void 0 : customer.address), { city: e.target.value }) }))} className="w-full px-3 py-2 border rounded-md" placeholder="Enter city"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <input type="text" value={((_f = customer === null || customer === void 0 ? void 0 : customer.address) === null || _f === void 0 ? void 0 : _f.state) || ''} onChange={(e) => setCustomer(Object.assign(Object.assign({}, customer), { address: Object.assign(Object.assign({}, customer === null || customer === void 0 ? void 0 : customer.address), { state: e.target.value }) }))} className="w-full px-3 py-2 border rounded-md" placeholder="Enter state"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ZIP Code</label>
                    <input type="text" value={((_g = customer === null || customer === void 0 ? void 0 : customer.address) === null || _g === void 0 ? void 0 : _g.zipCode) || ''} onChange={(e) => setCustomer(Object.assign(Object.assign({}, customer), { address: Object.assign(Object.assign({}, customer === null || customer === void 0 ? void 0 : customer.address), { zipCode: e.target.value }) }))} className="w-full px-3 py-2 border rounded-md" placeholder="Enter ZIP code"/>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                console.log('Saving address:', customer === null || customer === void 0 ? void 0 : customer.address);
                if (customer === null || customer === void 0 ? void 0 : customer.address) {
                    handleUpdateProfile({ address: Object.assign({}, customer.address) });
                }
            }}>
                    Save Address
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gate Code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gate Code</CardTitle>
              <CardDescription>Update your gate access code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Gate Code</label>
                  <input type="text" value={(customer === null || customer === void 0 ? void 0 : customer.gateCode) || ''} onChange={(e) => setCustomer(Object.assign(Object.assign({}, customer), { gateCode: e.target.value }))} className="w-full px-3 py-2 border rounded-md" placeholder="Enter gate code"/>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                console.log('Saving gate code:', customer === null || customer === void 0 ? void 0 : customer.gateCode);
                handleUpdateProfile({ gateCode: customer === null || customer === void 0 ? void 0 : customer.gateCode });
            }}>
                    Save Gate Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Service Preferences</CardTitle>
              <CardDescription>Set your preferred service day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Preferred Service Day</label>
                  <select value={(customer === null || customer === void 0 ? void 0 : customer.serviceDay) || ''} onChange={(e) => setCustomer(Object.assign(Object.assign({}, customer), { serviceDay: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select a day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                console.log('Saving service day:', customer === null || customer === void 0 ? void 0 : customer.serviceDay);
                handleUpdateProfile({ serviceDay: customer === null || customer === void 0 ? void 0 : customer.serviceDay });
            }}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>)}
    </div>);
}
