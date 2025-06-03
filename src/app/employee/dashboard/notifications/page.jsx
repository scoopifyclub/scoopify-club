"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Bell, 
    BellOff, 
    Calendar, 
    Clock, 
    User, 
    MessageCircle, 
    AlertTriangle, 
    CheckCircle, 
    Info,
    Search,
    Settings,
    MarkAsRead,
    Trash2
} from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Get authentication token from localStorage or cookies
                const token = localStorage.getItem('token') || 
                            document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
                
                const response = await fetch('/api/notifications', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Format notifications data
                    const formattedNotifications = (data.notifications || []).map(notification => ({
                        id: notification.id,
                        type: notification.type || 'system_update',
                        title: notification.title || getNotificationTitle(notification.type),
                        message: notification.message || notification.content || 'No message content',
                        customer: notification.customer || null,
                        timestamp: notification.createdAt || notification.timestamp,
                        read: notification.read || false,
                        priority: notification.priority || 'low',
                        actionRequired: notification.actionRequired || false
                    }));
                    
                    setNotifications(formattedNotifications);
                } else if (response.status === 401) {
                    // User not authenticated, show empty state
                    setNotifications([]);
                } else {
                    console.error('Failed to fetch notifications');
                    setError('Failed to load notifications');
                    setNotifications([]);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setError('Failed to load notifications');
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchNotifications();
    }, []);

    const getNotificationTitle = (type) => {
        switch (type) {
            case 'service_reminder':
                return 'Service Reminder';
            case 'new_message':
                return 'New Message';
            case 'payment_received':
                return 'Payment Received';
            case 'schedule_change':
                return 'Schedule Updated';
            case 'weather_alert':
                return 'Weather Alert';
            case 'customer_review':
                return 'New Review';
            case 'service_completed':
                return 'Service Completed';
            case 'system_update':
                return 'System Update';
            default:
                return 'Notification';
        }
    };

    const filteredNotifications = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.customer && notification.customer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const unreadNotifications = filteredNotifications.filter(n => !n.read);
    const readNotifications = filteredNotifications.filter(n => n.read);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'service_reminder':
                return <Calendar className="h-5 w-5 text-blue-600" />;
            case 'new_message':
                return <MessageCircle className="h-5 w-5 text-green-600" />;
            case 'payment_received':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'schedule_change':
                return <Clock className="h-5 w-5 text-purple-600" />;
            case 'weather_alert':
                return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            case 'customer_review':
                return <User className="h-5 w-5 text-yellow-600" />;
            case 'service_completed':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'system_update':
                return <Info className="h-5 w-5 text-blue-600" />;
            default:
                return <Bell className="h-5 w-5 text-gray-600" />;
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
            case 'medium':
                return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
            case 'low':
                return <Badge className="bg-gray-100 text-gray-600">Low</Badge>;
            default:
                return null;
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown time';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token') || 
                        document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notification => 
                        notification.id === notificationId 
                            ? { ...notification, read: true }
                            : notification
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token') || 
                        document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            
            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notification => ({ ...notification, read: true }))
                );
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token') || 
                        document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.filter(notification => notification.id !== notificationId)
                );
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
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

    if (error) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">Notifications</h1>
                    <p className="text-gray-600">Stay updated with important information</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">⚠️ {error}</p>
                            <Button onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Notifications</h1>
                <p className="text-gray-600">Stay updated with important information</p>
            </div>

            {/* Notification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Bell className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                                <p className="text-2xl font-bold">{notifications.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <BellOff className="h-8 w-8 text-red-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Unread</p>
                                <p className="text-2xl font-bold">{unreadNotifications.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Action Required</p>
                                <p className="text-2xl font-bold">
                                    {notifications.filter(n => n.actionRequired && !n.read).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {unreadNotifications.length > 0 && (
                        <Button onClick={markAllAsRead} variant="outline">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark All Read
                        </Button>
                    )}
                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Notifications Tabs */}
            <Tabs defaultValue="unread" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
                    <TabsTrigger value="all">All Notifications ({notifications.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="space-y-4">
                    {unreadNotifications.map((notification) => (
                        <Card key={notification.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {getNotificationIcon(notification.type)}
                                            <h3 className="text-lg font-semibold">{notification.title}</h3>
                                            {getPriorityBadge(notification.priority)}
                                            {notification.actionRequired && (
                                                <Badge className="bg-orange-100 text-orange-800">Action Required</Badge>
                                            )}
                                        </div>
                                        
                                        <p className="text-gray-700 mb-3">{notification.message}</p>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTimestamp(notification.timestamp)}</span>
                                            </div>
                                            {notification.customer && (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{notification.customer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-4">
                                        <Button 
                                            size="sm" 
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Mark Read
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => deleteNotification(notification.id)}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {unreadNotifications.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">All Caught Up!</h3>
                                <p className="text-gray-500">You have no unread notifications.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            {getNotificationIcon(notification.type)}
                                            <h3 className={`text-lg ${notification.read ? 'text-gray-600' : 'font-semibold'}`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <Badge className="bg-blue-100 text-blue-800">New</Badge>
                                            )}
                                            {getPriorityBadge(notification.priority)}
                                            {notification.actionRequired && !notification.read && (
                                                <Badge className="bg-orange-100 text-orange-800">Action Required</Badge>
                                            )}
                                        </div>
                                        
                                        <p className={`mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                            {notification.message}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTimestamp(notification.timestamp)}</span>
                                            </div>
                                            {notification.customer && (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{notification.customer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 ml-4">
                                        {!notification.read && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Mark Read
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => deleteNotification(notification.id)}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredNotifications.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Notifications</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'No notifications match your search.' : 'You have no notifications yet.'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
