// Customer Support Chat Component
// For communication system - customer support chat, service status updates, payment reminders, marketing communications
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Phone, Mail, Clock, CheckCircle, AlertCircle, Users, Calendar, DollarSign, Settings, Archive, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const CustomerSupportChat = ({
  onMessageSend,
  onStatusUpdate,
  onReminderSend,
  onMarketingSend,
  className,
  ...props
}) => {
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Mock data for demonstration
  const mockChatData = {
    conversations: [
      {
        id: '1',
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        status: 'active',
        priority: 'high',
        lastMessage: '2024-01-15T11:30:00Z',
        unreadCount: 2,
        subject: 'Service not completed on scheduled day',
        messages: [
          {
            id: '1',
            sender: 'customer',
            content: 'Hi, my service was supposed to be completed yesterday but no one showed up.',
            timestamp: '2024-01-15T10:15:00Z',
            status: 'read'
          },
          {
            id: '2',
            sender: 'agent',
            content: 'I apologize for the inconvenience. Let me check your service schedule and get back to you immediately.',
            timestamp: '2024-01-15T10:20:00Z',
            status: 'read'
          },
          {
            id: '3',
            sender: 'customer',
            content: 'Thank you. I really need this service completed today if possible.',
            timestamp: '2024-01-15T11:30:00Z',
            status: 'unread'
          }
        ]
      },
      {
        id: '2',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah@example.com',
        customerPhone: '+1234567891',
        status: 'resolved',
        priority: 'medium',
        lastMessage: '2024-01-14T16:45:00Z',
        unreadCount: 0,
        subject: 'Payment method update needed',
        messages: [
          {
            id: '1',
            sender: 'customer',
            content: 'I need to update my payment method. Can you help me with that?',
            timestamp: '2024-01-14T14:30:00Z',
            status: 'read'
          },
          {
            id: '2',
            sender: 'agent',
            content: 'Of course! I can help you update your payment method. Please visit your dashboard and go to the billing section.',
            timestamp: '2024-01-14T15:00:00Z',
            status: 'read'
          },
          {
            id: '3',
            sender: 'customer',
            content: 'Perfect, I was able to update it. Thank you!',
            timestamp: '2024-01-14T16:45:00Z',
            status: 'read'
          }
        ]
      }
    ],
    serviceUpdates: [
      {
        id: '1',
        customerName: 'John Smith',
        serviceDate: '2024-01-16T10:00:00Z',
        status: 'scheduled',
        type: 'weekly',
        address: '123 Main St, Peyton, CO 80831',
        notes: 'Large yard, 2 dogs'
      },
      {
        id: '2',
        customerName: 'Sarah Johnson',
        serviceDate: '2024-01-16T11:00:00Z',
        status: 'in_progress',
        type: 'weekly',
        address: '456 Oak Ave, Peyton, CO 80831',
        notes: 'Small yard, 1 dog'
      }
    ],
    paymentReminders: [
      {
        id: '1',
        customerName: 'Mike Wilson',
        customerEmail: 'mike@example.com',
        amount: 45.00,
        dueDate: '2024-01-20T00:00:00Z',
        status: 'pending',
        lastReminder: '2024-01-15T09:00:00Z'
      },
      {
        id: '2',
        customerName: 'Lisa Brown',
        customerEmail: 'lisa@example.com',
        amount: 35.00,
        dueDate: '2024-01-22T00:00:00Z',
        status: 'pending',
        lastReminder: null
      }
    ],
    marketingCampaigns: [
      {
        id: '1',
        name: 'Referral Program Launch',
        description: 'Announce our new referral program with $30 rewards',
        status: 'draft',
        targetAudience: 'active_customers',
        estimatedReach: 342,
        scheduledDate: '2024-01-20T10:00:00Z'
      },
      {
        id: '2',
        name: 'Holiday Service Reminder',
        description: 'Remind customers about holiday service schedule',
        status: 'scheduled',
        targetAudience: 'all_customers',
        estimatedReach: 500,
        scheduledDate: '2024-01-25T09:00:00Z'
      }
    ]
  };

  useEffect(() => {
    loadChatData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChatData(mockChatData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    try {
      const newMessage = {
        id: Date.now().toString(),
        sender: 'agent',
        content: message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      const updatedConversation = {
        ...selectedConversation,
        messages: [...selectedConversation.messages, newMessage],
        lastMessage: new Date().toISOString(),
        unreadCount: 0
      };

      setSelectedConversation(updatedConversation);
      setMessage('');
      await onMessageSend?.(selectedConversation.id, newMessage);
    } catch (err) {
      console.error('Message send failed:', err);
    }
  };

  const handleStatusUpdate = async (conversationId, status) => {
    try {
      await onStatusUpdate?.(conversationId, status);
      // Update local state
      const updatedConversations = chatData.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, status } : conv
      );
      setChatData({ ...chatData, conversations: updatedConversations });
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleReminderSend = async (reminderId) => {
    try {
      await onReminderSend?.(reminderId);
    } catch (err) {
      console.error('Reminder send failed:', err);
    }
  };

  const handleMarketingSend = async (campaignId) => {
    try {
      await onMarketingSend?.(campaignId);
    } catch (err) {
      console.error('Marketing send failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      resolved: 'secondary',
      pending: 'outline',
      scheduled: 'outline',
      in_progress: 'default',
      draft: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return <span className={cn("text-sm font-medium", colors[priority])}>{priority}</span>;
  };

  const filteredConversations = chatData?.conversations.filter(conv =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderChatInterface = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversation List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <div className="space-y-2">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "p-4 cursor-pointer border-l-4 transition-colors",
                  selectedConversation?.id === conversation.id
                    ? "bg-blue-50 border-blue-500"
                    : "hover:bg-gray-50 border-transparent"
                )}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{conversation.customerName}</div>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(conversation.priority)}
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">{conversation.subject}</div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(conversation.lastMessage).toLocaleTimeString()}</span>
                  {getStatusBadge(conversation.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedConversation.customerName}</CardTitle>
                  <CardDescription>{selectedConversation.subject}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Select
                    value={selectedConversation.status}
                    onValueChange={(value) => handleStatusUpdate(selectedConversation.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender === 'agent' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] p-3 rounded-lg",
                        msg.sender === 'agent'
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div className={cn(
                        "text-xs mt-1",
                        msg.sender === 'agent' ? "text-blue-100" : "text-gray-500"
                      )}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                    rows={2}
                  />
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start chatting</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );

  const renderServiceUpdates = () => (
    <div className="space-y-6">
      {/* Service Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {chatData.serviceUpdates.filter(s => s.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {chatData.serviceUpdates.filter(s => s.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {chatData.serviceUpdates.filter(s => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Today's Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {chatData.serviceUpdates.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service List */}
      <Card>
        <CardHeader>
          <CardTitle>Service Updates</CardTitle>
          <CardDescription>Today's service schedule and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatData.serviceUpdates.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{service.customerName}</div>
                    <div className="text-sm text-gray-600">{service.address}</div>
                    <div className="text-xs text-gray-500">{service.notes}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(service.serviceDate).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(service.serviceDate).toLocaleDateString()}
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentReminders = () => (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {chatData.paymentReminders.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${chatData.paymentReminders.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {chatData.paymentReminders.filter(r => 
                new Date(r.dueDate) < new Date() && r.status === 'pending'
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Reminders</CardTitle>
          <CardDescription>Send payment reminders to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatData.paymentReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{reminder.customerName}</div>
                  <div className="text-sm text-gray-600">{reminder.customerEmail}</div>
                  <div className="text-xs text-gray-500">
                    Due: {new Date(reminder.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${reminder.amount.toFixed(2)}
                  </div>
                  {getStatusBadge(reminder.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleReminderSend(reminder.id)}
                  >
                    Send Reminder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketingCommunications = () => (
    <div className="space-y-6">
      {/* Marketing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Draft Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {chatData.marketingCampaigns.filter(c => c.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {chatData.marketingCampaigns.filter(c => c.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {chatData.marketingCampaigns.reduce((sum, c) => sum + c.estimatedReach, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Communications</CardTitle>
          <CardDescription>Manage marketing campaigns and communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatData.marketingCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-sm text-gray-600">{campaign.description}</div>
                  <div className="text-xs text-gray-500">
                    Target: {campaign.targetAudience.replace('_', ' ')} • 
                    Reach: {campaign.estimatedReach} customers
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {new Date(campaign.scheduledDate).toLocaleDateString()}
                  </div>
                  {getStatusBadge(campaign.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleMarketingSend(campaign.id)}
                  >
                    Send Campaign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading support system..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error loading support system: {error}</div>
        <Button onClick={loadChatData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Support & Communications</h2>
          <p className="text-gray-600">Manage customer support, service updates, and communications</p>
        </div>
        <Button onClick={loadChatData} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Support Chat</TabsTrigger>
          <TabsTrigger value="services">Service Updates</TabsTrigger>
          <TabsTrigger value="payments">Payment Reminders</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          {renderChatInterface()}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {renderServiceUpdates()}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {renderPaymentReminders()}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          {renderMarketingCommunications()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerSupportChat; 