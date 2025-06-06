"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    User, 
    Bell, 
    Shield, 
    CreditCard,
    Smartphone,
    Mail,
    MapPin,
    Clock,
    Save,
    Camera,
    Eye,
    EyeOff
} from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch real user data from API
        const fetchUserData = async () => {
            try {
                // Get current user info
                const userResponse = await fetch('/api/auth/me', {
                    credentials: 'include',
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUser(userData.user);
                    
                    // Get employee profile data
                    const employeeResponse = await fetch('/api/employee/profile', {
                        credentials: 'include',
                    });
                    
                    let employeeData = {};
                    if (employeeResponse.ok) {
                        employeeData = await employeeResponse.json();
                    }
                    
                    // Set real user data
                    setSettings({
                        profile: {
                            name: userData.user.name || '',
                            email: userData.user.email || '',
                            phone: employeeData.phone || '',
                            address: employeeData.address || '',
                            bio: employeeData.bio || '',
                            profileImage: null,
                            createdAt: userData.user.createdAt || employeeData.createdAt
                        },
                        notifications: {
                            emailNotifications: true,
                            smsNotifications: true,
                            pushNotifications: true,
                            serviceReminders: true,
                            paymentUpdates: true,
                            customerMessages: true,
                            weatherAlerts: true,
                            scheduleChanges: true
                        },
                        privacy: {
                            profileVisible: true,
                            shareLocation: true,
                            customerRatingsVisible: true,
                            analyticsSharing: false
                        },
                        workPreferences: {
                            preferredStartTime: '08:00',
                            preferredEndTime: '17:00',
                            maxDailyServices: 8,
                            serviceRadius: 15,
                            availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                            emergencyServices: false
                        },
                        payment: {
                            method: 'Direct Deposit',
                            bankAccount: '****1234',
                            frequency: 'bi-weekly',
                            minimumPayout: 50
                        }
                    });
                } else {
                    // Fallback to empty data if API fails
                    setSettings({
                        profile: {
                            name: '',
                            email: '',
                            phone: '',
                            address: '',
                            bio: '',
                            profileImage: null
                        },
                        notifications: {
                            emailNotifications: true,
                            smsNotifications: true,
                            pushNotifications: true,
                            serviceReminders: true,
                            paymentUpdates: true,
                            customerMessages: true,
                            weatherAlerts: true,
                            scheduleChanges: true
                        },
                        privacy: {
                            profileVisible: true,
                            shareLocation: true,
                            customerRatingsVisible: true,
                            analyticsSharing: false
                        },
                        workPreferences: {
                            preferredStartTime: '08:00',
                            preferredEndTime: '17:00',
                            maxDailyServices: 8,
                            serviceRadius: 15,
                            availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                            emergencyServices: false
                        },
                        payment: {
                            method: 'Direct Deposit',
                            bankAccount: '****1234',
                            frequency: 'bi-weekly',
                            minimumPayout: 50
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Set empty defaults on error
                setSettings({
                    profile: {
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        bio: '',
                        profileImage: null
                    },
                    notifications: {
                        emailNotifications: true,
                        smsNotifications: true,
                        pushNotifications: true,
                        serviceReminders: true,
                        paymentUpdates: true,
                        customerMessages: true,
                        weatherAlerts: true,
                        scheduleChanges: true
                    },
                    privacy: {
                        profileVisible: true,
                        shareLocation: true,
                        customerRatingsVisible: true,
                        analyticsSharing: false
                    },
                    workPreferences: {
                        preferredStartTime: '08:00',
                        preferredEndTime: '17:00',
                        maxDailyServices: 8,
                        serviceRadius: 15,
                        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        emergencyServices: false
                    },
                    payment: {
                        method: 'Direct Deposit',
                        bankAccount: '****1234',
                        frequency: 'bi-weekly',
                        minimumPayout: 50
                    }
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);

    const handleSave = async (section) => {
        console.log(`Saving ${section} settings...`);
        try {
            const response = await fetch('/api/employee/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    section,
                    data: settings[section]
                }),
            });
            
            if (response.ok) {
                console.log(`${section} settings saved successfully`);
                // Show success message
            } else {
                console.error(`Failed to save ${section} settings`);
                // Show error message
            }
        } catch (error) {
            console.error(`Error saving ${section} settings:`, error);
        }
    };

    const handleProfileImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('Uploading profile image:', file.name);
            // Handle image upload
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
            return 'Recently';
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="work">Work</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Profile Image */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                        {settings.profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </div>
                                    <label 
                                        htmlFor="profile-image"
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700"
                                    >
                                        <Camera className="h-4 w-4" />
                                        <input
                                            id="profile-image"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleProfileImageUpload}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">{settings.profile?.name || 'Employee'}</h3>
                                    <p className="text-gray-600">
                                        Employee since {formatDate(settings.profile?.createdAt)}
                                    </p>
                                    <p className="text-sm text-gray-500">Click the camera icon to update your profile photo</p>
                                </div>
                            </div>

                            {/* Profile Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={settings.profile?.name || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            profile: { ...prev.profile, name: e.target.value }
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={settings.profile?.email || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            profile: { ...prev.profile, email: e.target.value }
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={settings.profile?.phone || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            profile: { ...prev.profile, phone: e.target.value }
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={settings.profile?.address || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            profile: { ...prev.profile, address: e.target.value }
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="Tell customers about yourself..."
                                    value={settings.profile?.bio || ''}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        profile: { ...prev.profile, bio: e.target.value }
                                    }))}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Change Password</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="current-password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter current password"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => handleSave('profile')} className="w-full">
                                <Save className="h-4 w-4 mr-2" />
                                Save Profile Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-medium">Communication Channels</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium">Email Notifications</p>
                                                <p className="text-sm text-gray-600">Receive updates via email</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.notifications?.emailNotifications}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                notifications: { ...prev.notifications, emailNotifications: checked }
                                            }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-5 w-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium">SMS Notifications</p>
                                                <p className="text-sm text-gray-600">Receive text messages</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.notifications?.smsNotifications}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                notifications: { ...prev.notifications, smsNotifications: checked }
                                            }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Bell className="h-5 w-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium">Push Notifications</p>
                                                <p className="text-sm text-gray-600">Browser and mobile app notifications</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.notifications?.pushNotifications}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                notifications: { ...prev.notifications, pushNotifications: checked }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Notification Types</h4>
                                <div className="space-y-4">
                                    {[
                                        { key: 'serviceReminders', label: 'Service Reminders', desc: 'Upcoming appointment notifications' },
                                        { key: 'paymentUpdates', label: 'Payment Updates', desc: 'Earnings and payout notifications' },
                                        { key: 'customerMessages', label: 'Customer Messages', desc: 'New messages from customers' },
                                        { key: 'weatherAlerts', label: 'Weather Alerts', desc: 'Weather-related service updates' },
                                        { key: 'scheduleChanges', label: 'Schedule Changes', desc: 'Changes to your service schedule' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-sm text-gray-600">{item.desc}</p>
                                            </div>
                                            <Switch
                                                checked={settings.notifications?.[item.key]}
                                                onCheckedChange={(checked) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: { ...prev.notifications, [item.key]: checked }
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={() => handleSave('notifications')} className="w-full">
                                <Save className="h-4 w-4 mr-2" />
                                Save Notification Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="work" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Work Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="start-time">Preferred Start Time</Label>
                                    <Input
                                        id="start-time"
                                        type="time"
                                        value={settings.workPreferences?.preferredStartTime || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            workPreferences: { ...prev.workPreferences, preferredStartTime: e.target.value }
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end-time">Preferred End Time</Label>
                                    <Input
                                        id="end-time"
                                        type="time"
                                        value={settings.workPreferences?.preferredEndTime || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            workPreferences: { ...prev.workPreferences, preferredEndTime: e.target.value }
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max-services">Max Daily Services</Label>
                                    <Input
                                        id="max-services"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settings.workPreferences?.maxDailyServices || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            workPreferences: { ...prev.workPreferences, maxDailyServices: parseInt(e.target.value) }
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service-radius">Service Radius (miles)</Label>
                                    <Input
                                        id="service-radius"
                                        type="number"
                                        min="5"
                                        max="50"
                                        value={settings.workPreferences?.serviceRadius || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            workPreferences: { ...prev.workPreferences, serviceRadius: parseInt(e.target.value) }
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Available Days</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { key: 'monday', label: 'Monday' },
                                        { key: 'tuesday', label: 'Tuesday' },
                                        { key: 'wednesday', label: 'Wednesday' },
                                        { key: 'thursday', label: 'Thursday' },
                                        { key: 'friday', label: 'Friday' },
                                        { key: 'saturday', label: 'Saturday' },
                                        { key: 'sunday', label: 'Sunday' }
                                    ].map((day) => (
                                        <div key={day.key} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={day.key}
                                                checked={settings.workPreferences?.availableDays?.includes(day.key)}
                                                onChange={(e) => {
                                                    const days = settings.workPreferences?.availableDays || [];
                                                    const newDays = e.target.checked
                                                        ? [...days, day.key]
                                                        : days.filter(d => d !== day.key);
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        workPreferences: { ...prev.workPreferences, availableDays: newDays }
                                                    }));
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <Label htmlFor={day.key} className="text-sm">{day.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Emergency Services</p>
                                    <p className="text-sm text-gray-600">Accept urgent service requests outside normal hours</p>
                                </div>
                                <Switch
                                    checked={settings.workPreferences?.emergencyServices}
                                    onCheckedChange={(checked) => setSettings(prev => ({
                                        ...prev,
                                        workPreferences: { ...prev.workPreferences, emergencyServices: checked }
                                    }))}
                                />
                            </div>

                            <Button onClick={() => handleSave('work')} className="w-full">
                                <Save className="h-4 w-4 mr-2" />
                                Save Work Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="payment-method">Payment Method</Label>
                                    <Select 
                                        value={settings.payment?.method || ''} 
                                        onValueChange={(value) => setSettings(prev => ({
                                            ...prev,
                                            payment: { ...prev.payment, method: value }
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH_APP">Cash App</SelectItem>
                                            <SelectItem value="STRIPE">Stripe Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        Choose how you want to receive payments
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment-frequency">Payment Frequency</Label>
                                    <Select 
                                        value={settings.payment?.frequency || 'weekly'} 
                                        onValueChange={(value) => setSettings(prev => ({
                                            ...prev,
                                            payment: { ...prev.payment, frequency: value }
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {settings.payment?.method === 'CASH_APP' && (
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="cash-app-username">Cash App Username</Label>
                                        <Input
                                            id="cash-app-username"
                                            placeholder="$YourCashAppName"
                                            value={settings.payment?.cashAppUsername || ''}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                payment: { ...prev.payment, cashAppUsername: e.target.value }
                                            }))}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Enter your Cash App username (e.g., $JohnDoe) to receive payments
                                        </p>
                                    </div>
                                )}

                                {settings.payment?.method === 'STRIPE' && (
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="stripe-email">Email for Stripe Transfer</Label>
                                        <Input
                                            id="stripe-email"
                                            type="email"
                                            placeholder="your-email@example.com"
                                            value={settings.payment?.stripeEmail || settings.profile?.email || ''}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                payment: { ...prev.payment, stripeEmail: e.target.value }
                                            }))}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Payments will be sent to this email via Stripe
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="minimum-payout">Minimum Payout ($)</Label>
                                    <Input
                                        id="minimum-payout"
                                        type="number"
                                        min="25"
                                        max="500"
                                        value={settings.payment?.minimumPayout || 50}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            payment: { ...prev.payment, minimumPayout: parseInt(e.target.value) }
                                        }))}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Minimum amount before payment is sent (minimum $25)
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Payments are processed every {settings.payment?.frequency || 'weekly'}</li>
                                    <li>• Payment method: {settings.payment?.method === 'CASH_APP' ? 'Cash App' : settings.payment?.method === 'STRIPE' ? 'Stripe Transfer' : 'Not selected'}</li>
                                    <li>• Minimum payout: ${settings.payment?.minimumPayout || 50}</li>
                                    <li>• All payments are processed by admin and sent within 2-3 business days</li>
                                </ul>
                            </div>

                            {(!settings.payment?.method || 
                              (settings.payment?.method === 'CASH_APP' && !settings.payment?.cashAppUsername) ||
                              (settings.payment?.method === 'STRIPE' && !settings.payment?.stripeEmail)) && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="text-yellow-600 mr-3">⚠️</div>
                                        <div>
                                            <h4 className="font-medium text-yellow-800">Payment Setup Required</h4>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                Complete your payment information to receive earnings from completed services.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button onClick={() => handleSave('payment')} className="w-full">
                                <Save className="h-4 w-4 mr-2" />
                                Save Payment Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Privacy & Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-medium">Profile Visibility</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Public Profile</p>
                                            <p className="text-sm text-gray-600">Allow customers to view your profile</p>
                                        </div>
                                        <Switch
                                            checked={settings.privacy?.profileVisible}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                privacy: { ...prev.privacy, profileVisible: checked }
                                            }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Share Location</p>
                                            <p className="text-sm text-gray-600">Share your location with customers during service</p>
                                        </div>
                                        <Switch
                                            checked={settings.privacy?.shareLocation}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                privacy: { ...prev.privacy, shareLocation: checked }
                                            }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Visible Ratings</p>
                                            <p className="text-sm text-gray-600">Show your ratings to potential customers</p>
                                        </div>
                                        <Switch
                                            checked={settings.privacy?.customerRatingsVisible}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                privacy: { ...prev.privacy, customerRatingsVisible: checked }
                                            }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Analytics Sharing</p>
                                            <p className="text-sm text-gray-600">Share anonymous usage data to improve the service</p>
                                        </div>
                                        <Switch
                                            checked={settings.privacy?.analyticsSharing}
                                            onCheckedChange={(checked) => setSettings(prev => ({
                                                ...prev,
                                                privacy: { ...prev.privacy, analyticsSharing: checked }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Account Security</h4>
                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Enable Two-Factor Authentication
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        <User className="h-4 w-4 mr-2" />
                                        Download My Data
                                    </Button>
                                    <Button variant="destructive" className="w-full justify-start">
                                        Delete Account
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={() => handleSave('privacy')} className="w-full">
                                <Save className="h-4 w-4 mr-2" />
                                Save Privacy Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
