'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagingSystem({ employeeId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/employee/messages', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`/api/employee/messages?conversationId=${userId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);

      // Mark messages as read
      const unreadMessages = data.filter(msg => !msg.read && msg.senderId !== employeeId);
      if (unreadMessages.length > 0) {
        await markMessagesAsRead(unreadMessages.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (messageIds) => {
    try {
      await fetch('/api/employee/messages', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('/api/employee/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          content: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Customer Messaging
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-96">
          {/* Conversations List */}
          <div className="border rounded-lg p-4 space-y-2 overflow-y-auto">
            <h3 className="font-semibold mb-3">Conversations</h3>
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet</p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.userId === conversation.userId
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {conversation.user?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2 border rounded-lg flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedConversation.user?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">No messages yet</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === employeeId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                            message.senderId === employeeId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            message.senderId === employeeId ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 