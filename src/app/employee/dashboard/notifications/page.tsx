'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bell, Calendar, CheckCircle, Clock, Info, MessageSquare, Settings, User, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRead, setShowRead] = useState(true);
  const { toast } = useToast();

  // Fetch notifications
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Service Assignment',
          message: 'You have been assigned to a new pool service for customer John Smith on April 25.',
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
          title: 'Chemical Level Warning',
          message: 'The chlorine levels at 123 Main St. pool are below recommended levels. Please address during your next visit.',
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
        },
        {
          id: '6',
          title: 'Earnings Update',
          message: 'Your weekly earnings report is now available. You completed 12 services this week.',
          type: 'INFO',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
          isRead: true,
          link: '/employee/dashboard/earnings',
          source: 'payment'
        },
        {
          id: '7',
          title: 'Schedule Change',
          message: 'A service on your schedule has been rescheduled. Please check your updated schedule.',
          type: 'WARNING',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
          isRead: true,
          link: '/employee/dashboard/schedule',
          source: 'scheduling'
        },
        {
          id: '8',
          title: 'New Training Available',
          message: 'A new training module on advanced water chemistry is now available.',
          type: 'INFO',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
          isRead: true,
          source: 'admin'
        },
        {
          id: '9',
          title: 'Service Photo Missing',
          message: 'You did not upload the required "After Service" photo for your service at 456 Oak Drive.',
          type: 'ERROR',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
          isRead: false,
          source: 'system'
        },
        {
          id: '10',
          title: 'Performance Review',
          message: 'Your quarterly performance review is scheduled for next week.',
          type: 'INFO',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144), // 6 days ago
          isRead: true,
          source: 'admin'
        }
      ];
      
      setNotifications(mockNotifications);
      setFilteredNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

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
    
    toast({
      title: "All notifications marked as read",
      description: "All your notifications have been marked as read.",
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    toast({
      title: "Notification deleted",
      description: "The notification has been removed from your list.",
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    
    toast({
      title: "All notifications cleared",
      description: "All your notifications have been cleared.",
    });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
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
              <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <NotificationList 
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            formatTime={formatTimestamp}
          />
        </TabsContent>
        
        <TabsContent value="unread" className="mt-6">
          <NotificationList 
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            formatTime={formatTimestamp}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  formatTime: (date: Date) => string;
}

function NotificationList({ notifications, onMarkAsRead, onDelete, getIcon, formatTime }: NotificationListProps) {
  const { toast } = useToast();
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No notifications to display</p>
      </div>
    );
  }
  
  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      // In a real app, navigate to the link
      toast({
        title: "Navigation",
        description: `Navigating to: ${notification.link}`,
      });
    }
  };
  
  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-3">
        {notifications.map(notification => (
          <Card 
            key={notification.id} 
            className={`transition-colors ${notification.isRead ? 'bg-background' : 'bg-accent/30'}`}
          >
            <CardContent className="p-4 relative">
              <div className="absolute right-4 top-4 flex gap-1">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDelete(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-3" onClick={() => handleClick(notification)}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  {getIcon(notification.type)}
                </div>
                <div className="space-y-1 pr-12">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium tracking-tight">{notification.title}</h4>
                    {!notification.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(notification.timestamp)}
                      {notification.source && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                          {notification.source}
                        </span>
                      )}
                    </div>
                    {notification.link && (
                      <Button variant="link" size="sm" className="h-auto p-0">
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
    </ScrollArea>
  );
} 