'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bell, Calendar, CheckCircle, Clock, Info, MessageSquare, Settings, User, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'SCHEDULE' | 'MESSAGE';
  timestamp: Date;
  isRead: boolean;
  link?: string;
  source?: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRead, setShowRead] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/employee/dashboard');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    // Fetch notifications data
    const fetchNotifications = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, using mock data
        const mockNotifications: Notification[] = [
          {
            id: '1',
            title: 'New Service Assignment',
            message: 'You have been assigned to a new yard cleanup for customer John Smith on April 25.',
            type: 'INFO',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            isRead: false,
            link: '/employee/dashboard/schedule',
            source: 'scheduling'
          },
          {
            id: '2',
            title: 'Service Reminder',
            message: 'You have a scheduled service today at 2:00 PM for customer Sarah Johnson.',
            type: 'SCHEDULE',
            timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
            isRead: true,
            link: '/employee/dashboard/schedule',
            source: 'scheduling'
          },
          {
            id: '3',
            title: 'Yard Size Warning',
            message: 'The yard at 123 Main St. is larger than described. Please allocate extra time during your next visit.',
            type: 'WARNING',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
            isRead: false,
            source: 'system'
          },
          {
            id: '4',
            title: 'Customer Message',
            message: 'You have received a new message from customer Mike Davis regarding their upcoming service.',
            type: 'MESSAGE',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
            isRead: false,
            link: '/employee/dashboard/messages',
            source: 'messaging'
          },
          {
            id: '5',
            title: 'Service Completed Successfully',
            message: 'Your service report for customer Taylor Wilson has been submitted successfully.',
            type: 'SUCCESS',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            isRead: true,
            source: 'system'
          }
        ];
        
        setNotifications(mockNotifications);
        setFilteredNotifications(mockNotifications);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching notifications data:', error);
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchNotifications();
    }
  }, [status, session, router]);

  // Apply filters whenever the dependencies change
  useEffect(() => {
    let filtered = [...notifications];
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(notification => {
        if (activeTab === 'unread') return !notification.isRead;
        return true;
      });
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(notification => notification.type === selectedType);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }
    
    // Filter read/unread
    if (!showRead) {
      filtered = filtered.filter(notification => !notification.isRead);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, activeTab, selectedType, searchQuery, showRead]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ERROR':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'SCHEDULE':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5 text-emerald-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-gray-500">
            Stay updated with service alerts, messages, and system notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllNotifications}>
            Clear all
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input 
            placeholder="Search notifications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INFO">Information</SelectItem>
              <SelectItem value="WARNING">Warnings</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="ERROR">Errors</SelectItem>
              <SelectItem value="SCHEDULE">Schedule</SelectItem>
              <SelectItem value="MESSAGE">Messages</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-read" 
              checked={showRead} 
              onCheckedChange={(checked) => setShowRead(checked as boolean)}
            />
            <label
              htmlFor="show-read"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show read notifications
            </label>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <span className="ml-2 text-xs bg-gray-200 text-gray-800 rounded-full px-2 py-0.5">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="ml-2 text-xs bg-green-500 text-white rounded-full px-2 py-0.5">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className={notification.isRead ? '' : 'border-l-4 border-l-green-500'}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{notification.title}</h3>
                          <div className="flex space-x-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                            {notification.source && (
                              <Badge variant="outline" className="ml-2">
                                {notification.source}
                              </Badge>
                            )}
                          </div>
                          {notification.link && (
                            <Button variant="link" size="sm" className="h-6 px-0">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No unread notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className="border-l-4 border-l-green-500"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{notification.title}</h3>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                            {notification.source && (
                              <Badge variant="outline" className="ml-2">
                                {notification.source}
                              </Badge>
                            )}
                          </div>
                          {notification.link && (
                            <Button variant="link" size="sm" className="h-6 px-0">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 