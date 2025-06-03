"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, User, Clock, Search, Phone, Mail } from 'lucide-react';

export default function MessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulate loading messages data
        setTimeout(() => {
            const mockConversations = [
                {
                    id: 1,
                    customer: {
                        name: 'John Smith',
                        email: 'john.smith@email.com',
                        phone: '(555) 123-4567',
                        avatar: 'JS'
                    },
                    lastMessage: {
                        text: 'Thank you for the great service yesterday!',
                        timestamp: '2024-01-20T10:30:00Z',
                        from: 'customer'
                    },
                    unread: 0,
                    messages: [
                        {
                            id: 1,
                            text: 'Hi! I wanted to reschedule tomorrow\'s appointment to the afternoon if possible.',
                            timestamp: '2024-01-19T14:30:00Z',
                            from: 'customer'
                        },
                        {
                            id: 2,
                            text: 'Hi John! I can move your appointment to 2:00 PM tomorrow. Does that work for you?',
                            timestamp: '2024-01-19T14:45:00Z',
                            from: 'employee'
                        },
                        {
                            id: 3,
                            text: 'Perfect! 2:00 PM works great. Thank you!',
                            timestamp: '2024-01-19T15:00:00Z',
                            from: 'customer'
                        },
                        {
                            id: 4,
                            text: 'Thank you for the great service yesterday!',
                            timestamp: '2024-01-20T10:30:00Z',
                            from: 'customer'
                        }
                    ]
                },
                {
                    id: 2,
                    customer: {
                        name: 'Sarah Johnson',
                        email: 'sarah.j@email.com',
                        phone: '(555) 234-5678',
                        avatar: 'SJ'
                    },
                    lastMessage: {
                        text: 'I\'ll be out of town next week, can we skip the service?',
                        timestamp: '2024-01-19T16:20:00Z',
                        from: 'customer'
                    },
                    unread: 1,
                    messages: [
                        {
                            id: 1,
                            text: 'I\'ll be out of town next week, can we skip the service?',
                            timestamp: '2024-01-19T16:20:00Z',
                            from: 'customer'
                        }
                    ]
                },
                {
                    id: 3,
                    customer: {
                        name: 'Mike Wilson',
                        email: 'mike.wilson@email.com',
                        phone: '(555) 345-6789',
                        avatar: 'MW'
                    },
                    lastMessage: {
                        text: 'Thanks for letting me know about the weather delay.',
                        timestamp: '2024-01-18T11:15:00Z',
                        from: 'customer'
                    },
                    unread: 0,
                    messages: [
                        {
                            id: 1,
                            text: 'Hi Mike, due to heavy rain today, I\'ll need to reschedule your service to tomorrow morning. Sorry for the inconvenience!',
                            timestamp: '2024-01-18T09:30:00Z',
                            from: 'employee'
                        },
                        {
                            id: 2,
                            text: 'Thanks for letting me know about the weather delay.',
                            timestamp: '2024-01-18T11:15:00Z',
                            from: 'customer'
                        }
                    ]
                }
            ];
            setConversations(mockConversations);
            setSelectedConversation(mockConversations[0]);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredConversations = conversations.filter(conv =>
        conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const message = {
            id: selectedConversation.messages.length + 1,
            text: newMessage,
            timestamp: new Date().toISOString(),
            from: 'employee'
        };

        const updatedConversations = conversations.map(conv => {
            if (conv.id === selectedConversation.id) {
                return {
                    ...conv,
                    messages: [...conv.messages, message],
                    lastMessage: {
                        text: newMessage,
                        timestamp: message.timestamp,
                        from: 'employee'
                    }
                };
            }
            return conv;
        });

        setConversations(updatedConversations);
        setSelectedConversation(prev => ({
            ...prev,
            messages: [...prev.messages, message]
        }));
        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Messages</h1>
                <p className="text-gray-600">Communicate with your customers</p>
            </div>

            {/* Message Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <MessageCircle className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                                <p className="text-2xl font-bold">{conversations.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Badge className="h-8 w-8 text-red-600 bg-red-100" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                                <p className="text-2xl font-bold">{conversations.reduce((sum, conv) => sum + conv.unread, 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                                <p className="text-2xl font-bold">98%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Messages Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Conversations
                        </CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1 max-h-[450px] overflow-y-auto">
                            {filteredConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                            {conversation.customer.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-medium text-sm truncate">{conversation.customer.name}</h4>
                                                {conversation.unread > 0 && (
                                                    <Badge className="bg-red-500 text-white text-xs">
                                                        {conversation.unread}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">
                                                {conversation.lastMessage.text}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(conversation.lastMessage.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                    {selectedConversation ? (
                        <>
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                            {selectedConversation.customer.avatar}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{selectedConversation.customer.name}</h3>
                                            <p className="text-sm text-gray-500">{selectedConversation.customer.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Phone className="h-4 w-4 mr-2" />
                                            Call
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-0">
                                {/* Messages */}
                                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                                    {selectedConversation.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.from === 'employee' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] rounded-lg p-3 ${
                                                message.from === 'employee'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                <p className="text-sm">{message.text}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.from === 'employee' ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                    {formatTime(message.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Message Input */}
                                <div className="border-t p-4">
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="min-h-[80px] resize-none"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <Button 
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            size="sm"
                                            className="self-end"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Press Enter to send, Shift+Enter for new line
                                    </p>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <CardContent className="p-8 text-center">
                            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Conversation</h3>
                            <p className="text-gray-500">Choose a conversation from the left to start messaging</p>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg hover:bg-gray-50">
                            <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <h4 className="font-medium mb-1">New Message</h4>
                            <p className="text-sm text-gray-600 mb-3">Start a new conversation with a customer</p>
                            <Button variant="outline" size="sm">Start Chat</Button>
                        </div>
                        
                        <div className="text-center p-4 border rounded-lg hover:bg-gray-50">
                            <User className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <h4 className="font-medium mb-1">Customer Info</h4>
                            <p className="text-sm text-gray-600 mb-3">View customer details and service history</p>
                            <Button variant="outline" size="sm">View Profile</Button>
                        </div>
                        
                        <div className="text-center p-4 border rounded-lg hover:bg-gray-50">
                            <Phone className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                            <h4 className="font-medium mb-1">Call Customer</h4>
                            <p className="text-sm text-gray-600 mb-3">Make a direct phone call for urgent matters</p>
                            <Button variant="outline" size="sm">Call Now</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
