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
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulate loading notifications data
        setTimeout(() => {
            setNotifications([
                {
                    id: 1,
                    type: 'service_reminder',
                    title: 'Service Reminder',
                    message: 'You have a service scheduled with John Smith today at 9:00 AM',
                    customer: 'John Smith',
                    timestamp: '2024-01-20T08:00:00Z',
                    read: false,
                    priority: 'high',
                    actionRequired: true
                },
                {
                    id: 2,
                    type: 'new_message',
                    title: 'New Message',
                    message: 'Sarah Johnson sent you a message about rescheduling',
                    customer: 'Sarah Johnson',
                    timestamp: '2024-01-19T16:20:00Z',
                    read: false,
                    priority: 'medium',
                    actionRequired: true
                },
                {
                    id: 3,
                    type: 'payment_received',
                    title: 'Payment Received',
                    message: 'Payment of $45.00 received from Mike Wilson',
                    customer: 'Mike Wilson',
                    timestamp: '2024-01-19T14:30:00Z',
                    read: true,
                    priority: 'low',
                    actionRequired: false
                },
                {
                    id: 4,
                    type: 'schedule_change',
                    title: 'Schedule Updated',
                    message: 'Your schedule for tomorrow has been updated with 3 new appointments',
                    customer: null,
                    timestamp: '2024-01-19T12:00:00Z',
                    read: true,
                    priority: 'medium',
                    actionRequired: false
                },
                {
                    id: 5,
                    type: 'weather_alert',
                    title: 'Weather Alert',
                    message: 'Heavy rain expected tomorrow. Consider rescheduling outdoor services.',
                    customer: null,
                    timestamp: '2024-01-19T10:15:00Z',
                    read: false,
                    priority: 'high',
                    actionRequired: true
                },
                {
                    id: 6,
                    type: 'customer_review',
                    title: 'New Review',
                    message: 'Lisa Brown left you a 5-star review: "Excellent service as always!"',
                    customer: 'Lisa Brown',
                    timestamp: '2024-01-18T18:45:00Z',
                    read: true,
                    priority: 'low',
                    actionRequired: false
                },
                {
                    id: 7,
                    type: 'service_completed',
                    title: 'Service Completed',
                    message: 'Service at 321 Elm St has been marked as completed',
                    customer: 'Lisa Brown',
                    timestamp: '2024-01-18T15:30:00Z',
                    read: true,
                    priority: 'low',
                    actionRequired: false
                },
                {
                    id: 8,
                    type: 'system_update',
                    title: 'System Update',
                    message: 'New features available! Check out the updated route optimization tools.',
                    customer: null,
                    timestamp: '2024-01-18T09:00:00Z',
                    read: false,
                    priority: 'low',
                    actionRequired: false
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

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

    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, read: true }))
        );
    };

    const deleteNotification = (notificationId) => {
        setNotifications(prev => 
            prev.filter(notification => notification.id !== notificationId)
        );
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
                <h1 className="text-2xl font-bold mb-2">Notifications</h1>
                <p className="text-gray-600">Stay updated with important alerts and messages</p>
            </div>

            {/* Notification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                                <p className="text-2xl font-bold">{notifications.filter(n => n.actionRequired).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Read</p>
                                <p className="text-2xl font-bold">{readNotifications.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={markAllAsRead} disabled={unreadNotifications.length === 0}>
                        <MarkAsRead className="h-4 w-4 mr-2" />
                        Mark All Read
                    </Button>
                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Notifications Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All Notifications ({filteredNotifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
                    <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4 flex-1">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{notification.title}</h3>
                                                {getPriorityBadge(notification.priority)}
                                                {notification.actionRequired && (
                                                    <Badge className="bg-orange-100 text-orange-800">Action Required</Badge>
                                                )}
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                )}
                                            </div>
                                            <p className="text-gray-700 mb-2">{notification.message}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>{formatTimestamp(notification.timestamp)}</span>
                                                {notification.customer && (
                                                    <span>• Customer: {notification.customer}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 ml-4">
                                        {!notification.read && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                Mark Read
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => deleteNotification(notification.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
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
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Notifications Found</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    {unreadNotifications.map((notification) => (
                        <Card key={notification.id} className="border-blue-200 bg-blue-50">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4 flex-1">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{notification.title}</h3>
                                                {getPriorityBadge(notification.priority)}
                                                {notification.actionRequired && (
                                                    <Badge className="bg-orange-100 text-orange-800">Action Required</Badge>
                                                )}
                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            </div>
                                            <p className="text-gray-700 mb-2">{notification.message}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>{formatTimestamp(notification.timestamp)}</span>
                                                {notification.customer && (
                                                    <span>• Customer: {notification.customer}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 ml-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            Mark Read
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => deleteNotification(notification.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
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

                <TabsContent value="read" className="space-y-4">
                    {readNotifications.map((notification) => (
                        <Card key={notification.id} className="opacity-75">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4 flex-1">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{notification.title}</h3>
                                                {getPriorityBadge(notification.priority)}
                                            </div>
                                            <p className="text-gray-700 mb-2">{notification.message}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>{formatTimestamp(notification.timestamp)}</span>
                                                {notification.customer && (
                                                    <span>• Customer: {notification.customer}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 ml-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => deleteNotification(notification.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {readNotifications.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Read Notifications</h3>
                                <p className="text-gray-500">Read notifications will appear here.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
