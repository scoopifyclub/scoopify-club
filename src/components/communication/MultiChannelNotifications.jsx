// Multi-Channel Notifications Component
// For communication system - email, SMS, push notifications, in-app notifications
import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Bell, Smartphone, Settings, Send, Clock, CheckCircle, AlertCircle, Users, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const MultiChannelNotifications = ({
  onNotificationSend,
  onSettingsUpdate,
  className,
  ...props
}) => {
  const [notificationData, setNotificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('compose');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [scheduledTime, setScheduledTime] = useState('');

  // Mock data for demonstration
  const mockNotificationData = {
    channels: {
      email: {
        enabled: true,
        status: 'active',
        deliveryRate: 98.5,
        lastSent: '2024-01-15T10:30:00Z',
        totalSent: 1247
      },
      sms: {
        enabled: true,
        status: 'active',
        deliveryRate: 99.2,
        lastSent: '2024-01-15T09:15:00Z',
        totalSent: 892
      },
      push: {
        enabled: false,
        status: 'inactive',
        deliveryRate: 0,
        lastSent: null,
        totalSent: 0
      },
      inApp: {
        enabled: true,
        status: 'active',
        deliveryRate: 100,
        lastSent: '2024-01-15T11:00:00Z',
        totalSent: 2156
      }
    },
    templates: [
      {
        id: 'service_reminder',
        name: 'Service Reminder',
        description: 'Remind customers about upcoming service',
        channels: ['email', 'sms', 'inApp'],
        content: {
          email: {
            subject: 'Your Scoopify service is scheduled for tomorrow',
            body: 'Hi {{customer_name}}, your weekly service is scheduled for {{service_date}} at {{service_time}}. Please ensure your yard is accessible.'
          },
          sms: {
            body: 'Hi {{customer_name}}, your Scoopify service is tomorrow at {{service_time}}. Please ensure yard access.'
          },
          inApp: {
            title: 'Service Reminder',
            body: 'Your service is scheduled for {{service_date}} at {{service_time}}'
          }
        }
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        description: 'Remind customers about payment due',
        channels: ['email', 'sms'],
        content: {
          email: {
            subject: 'Payment reminder - Scoopify Club',
            body: 'Hi {{customer_name}}, your monthly payment of ${{amount}} is due on {{due_date}}. Please update your payment method if needed.'
          },
          sms: {
            body: 'Hi {{customer_name}}, your Scoopify payment of ${{amount}} is due {{due_date}}. Update payment method if needed.'
          }
        }
      },
      {
        id: 'service_completed',
        name: 'Service Completed',
        description: 'Notify customers when service is completed',
        channels: ['email', 'inApp'],
        content: {
          email: {
            subject: 'Service completed - Scoopify Club',
            body: 'Hi {{customer_name}}, your service has been completed! Check your dashboard for photos and details.'
          },
          inApp: {
            title: 'Service Completed',
            body: 'Your service has been completed! Check for photos and details.'
          }
        }
      }
    ],
    recentNotifications: [
      {
        id: '1',
        type: 'service_reminder',
        channel: 'email',
        recipients: 45,
        status: 'sent',
        timestamp: '2024-01-15T10:30:00Z',
        deliveryRate: 98.5
      },
      {
        id: '2',
        type: 'payment_reminder',
        channel: 'sms',
        recipients: 23,
        status: 'sent',
        timestamp: '2024-01-15T09:15:00Z',
        deliveryRate: 100
      },
      {
        id: '3',
        type: 'service_completed',
        channel: 'inApp',
        recipients: 12,
        status: 'sent',
        timestamp: '2024-01-15T08:45:00Z',
        deliveryRate: 100
      }
    ],
    scheduledNotifications: [
      {
        id: '1',
        type: 'service_reminder',
        channel: 'email',
        recipients: 67,
        scheduledTime: '2024-01-16T08:00:00Z',
        status: 'scheduled'
      }
    ]
  };

  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotificationData(mockNotificationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = async (channel) => {
    try {
      const updatedData = {
        ...notificationData,
        channels: {
          ...notificationData.channels,
          [channel]: {
            ...notificationData.channels[channel],
            enabled: !notificationData.channels[channel].enabled
          }
        }
      };
      setNotificationData(updatedData);
      await onSettingsUpdate?.(channel, updatedData.channels[channel].enabled);
    } catch (err) {
      console.error('Channel toggle failed:', err);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = notificationData.templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content[selectedChannel]?.body || '');
    }
  };

  const handleSendNotification = async () => {
    try {
      await onNotificationSend?.({
        channel: selectedChannel,
        template: selectedTemplate,
        message,
        recipients,
        scheduledTime
      });
    } catch (err) {
      console.error('Notification send failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      sent: 'default',
      scheduled: 'outline',
      failed: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getChannelIcon = (channel) => {
    const icons = {
      email: <Mail className="w-4 h-4" />,
      sms: <Smartphone className="w-4 h-4" />,
      push: <Bell className="w-4 h-4" />,
      inApp: <MessageSquare className="w-4 h-4" />
    };
    return icons[channel] || <MessageSquare className="w-4 h-4" />;
  };

  const renderChannelStatus = () => (
    <div className="space-y-6">
      {/* Channel Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(notificationData.channels).map(([channel, data]) => (
          <Card key={channel} className={cn(data.enabled ? 'border-green-200' : 'border-gray-200')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getChannelIcon(channel)}
                  <CardTitle className="text-sm capitalize">{channel}</CardTitle>
                </div>
                <Switch
                  checked={data.enabled}
                  onCheckedChange={() => handleChannelToggle(channel)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(data.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery Rate</span>
                  <span className="text-sm font-medium">{data.deliveryRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Sent</span>
                  <span className="text-sm font-medium">{data.totalSent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>Delivery rates and usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(notificationData.channels).map(([channel, data]) => (
              <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(channel)}
                  <div>
                    <div className="font-medium capitalize">{channel}</div>
                    <div className="text-sm text-gray-600">
                      Last sent: {data.lastSent ? new Date(data.lastSent).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{data.deliveryRate}%</div>
                  <div className="text-sm text-gray-600">Delivery Rate</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompose = () => (
    <div className="space-y-6">
      {/* Compose Form */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
          <CardDescription>Send notifications across multiple channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Channel Selection */}
            <div>
              <Label htmlFor="channel">Notification Channel</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(notificationData.channels)
                    .filter(([_, data]) => data.enabled)
                    .map(([channel, data]) => (
                      <SelectItem key={channel} value={channel}>
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(channel)}
                          <span className="capitalize">{channel}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div>
              <Label htmlFor="template">Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {notificationData.templates
                    .filter(template => template.channels.includes(selectedChannel))
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message Content */}
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* Recipients */}
            <div>
              <Label htmlFor="recipients">Recipients (comma-separated emails/phone numbers)</Label>
              <Input
                id="recipients"
                placeholder="john@example.com, +1234567890"
                value={recipients.join(', ')}
                onChange={(e) => setRecipients(e.target.value.split(',').map(r => r.trim()))}
              />
            </div>

            {/* Schedule */}
            <div>
              <Label htmlFor="schedule">Schedule (optional)</Label>
              <Input
                id="schedule"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            {/* Send Button */}
            <Button onClick={handleSendNotification} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>Pre-built notification templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationData.templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    {template.channels.map((channel) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {getChannelIcon(channel)}
                        <span className="ml-1 capitalize">{channel}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Recently sent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationData.recentNotifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getChannelIcon(notification.channel)}
                  <div>
                    <div className="font-medium capitalize">{notification.channel}</div>
                    <div className="text-sm text-gray-600">
                      {notification.recipients} recipients • {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{notification.deliveryRate}%</div>
                  <div className="text-sm text-gray-600">Delivery Rate</div>
                  {getStatusBadge(notification.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Notifications</CardTitle>
          <CardDescription>Upcoming scheduled notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationData.scheduledNotifications.length > 0 ? (
              notificationData.scheduledNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium capitalize">{notification.channel}</div>
                      <div className="text-sm text-gray-600">
                        {notification.recipients} recipients • Scheduled for {new Date(notification.scheduledTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(notification.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                No scheduled notifications
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading notification system..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error loading notifications: {error}</div>
        <Button onClick={loadNotificationData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Channel Notifications</h2>
          <p className="text-gray-600">Send notifications across email, SMS, push, and in-app channels</p>
        </div>
        <Button onClick={loadNotificationData} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Channel Status</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          {renderChannelStatus()}
        </TabsContent>

        <TabsContent value="compose" className="space-y-6">
          {renderCompose()}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {renderHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiChannelNotifications; 