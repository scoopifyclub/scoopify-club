"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Send, Clock, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function MessagesPage() {
    const router = useRouter();
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    // Skip rendering during SSR
    if (typeof window === 'undefined') {
        return null;
    }

    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchConversations();
            fetchMessages();
        }
    }, [user]);

    const fetchConversations = async () => {
        try {
            // In a real app, you would fetch this data from your API
            // For now, using mock data
            const mockConversations = [
                {
                    id: '1',
                    participant: {
                        id: 'admin1',
                        name: 'Support Team',
                        avatar: 'https://ui-avatars.com/api/?name=Support+Team&background=0D8ABC&color=fff',
                        role: 'ADMIN'
                    },
                    lastMessage: {
                        content: 'Hi there! How can I help you today?',
                        timestamp: '2024-03-15T10:30:00',
                        isFromMe: false
                    },
                    unreadCount: 1
                },
                {
                    id: '2',
                    participant: {
                        id: 'manager1',
                        name: 'Sarah Johnson',
                        avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=9C27B0&color=fff',
                        role: 'MANAGER'
                    },
                    lastMessage: {
                        content: 'Please update me on your progress for today',
                        timestamp: '2024-03-14T16:45:00',
                        isFromMe: false
                    },
                    unreadCount: 2
                },
                {
                    id: '3',
                    participant: {
                        id: 'customer1',
                        name: 'John Smith',
                        avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=4CAF50&color=fff',
                        role: 'CUSTOMER'
                    },
                    lastMessage: {
                        content: 'Thanks for the great service yesterday!',
                        timestamp: '2024-03-13T09:15:00',
                        isFromMe: false
                    },
                    unreadCount: 0
                }
            ];
            setConversations(mockConversations);
            // Select the first conversation by default
            if (mockConversations.length > 0 && !selectedConversation) {
                setSelectedConversation(mockConversations[0].id);
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setIsLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/messages', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSelectConversation = (conversationId) => {
        setSelectedConversation(conversationId);
        // Mark messages as read
        setConversations(prev => prev.map(conv => 
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ));
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newMessage }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setNewMessage('');
            await fetchMessages();
            toast.success('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const filteredConversations = conversations.filter(conversation =>
        conversation.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    if (loading || isLoading || loadingMessages) {
        return (
            <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 h-[calc(100vh-4rem)] space-y-6 animate-fade-in">
            <div className="flex h-full gap-6">
                {/* Conversations Sidebar */}
                <div className="w-80 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                        <Button size="icon" variant="outline">
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </div>
                    
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"/>
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {filteredConversations.length > 0 ? (
                            filteredConversations.map(conversation => (
                                <Card
                                    key={conversation.id}
                                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                                        selectedConversation === conversation.id ? 'border-green-500 shadow-sm' : ''
                                    }`}
                                    onClick={() => handleSelectConversation(conversation.id)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex gap-3">
                                            <Avatar className="h-10 w-10">
                                                <img src={conversation.participant.avatar} alt={conversation.participant.name}/>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-medium text-sm truncate">{conversation.participant.name}</h3>
                                                    <span className="text-xs text-gray-500">{formatTime(conversation.lastMessage.timestamp)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {conversation.lastMessage.isFromMe ? 'You: ' : ''}{conversation.lastMessage.content}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <Badge variant="destructive" className="rounded-full text-xs">
                                                            {conversation.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No conversations found
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Message Content */}
                <div className="flex-1 border rounded-lg h-full flex flex-col bg-gray-50">
                    {selectedConversation ? (
                        <>
                            {/* Conversation Header */}
                            <div className="border-b bg-white p-4 rounded-t-lg">
                                {conversations.find(c => c.id === selectedConversation) && (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <img
                                                src={conversations.find(c => c.id === selectedConversation)?.participant.avatar}
                                                alt={conversations.find(c => c.id === selectedConversation)?.participant.name}
                                            />
                                        </Avatar>
                                        <div>
                                            <h2 className="font-bold">
                                                {conversations.find(c => c.id === selectedConversation)?.participant.name}
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                {conversations.find(c => c.id === selectedConversation)?.participant.role}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${
                                                message.senderId === user.id
                                                    ? 'bg-primary text-white rounded-tr-none'
                                                    : 'bg-gray-100 border rounded-tl-none'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <p>{message.content}</p>
                                            </div>
                                            <div
                                                className={`text-xs mt-1 flex justify-end ${
                                                    message.sender.role === 'EMPLOYEE' ? 'text-green-100' : 'text-gray-500'
                                                }`}
                                            >
                                                <Clock className="h-3 w-3 mr-1"/>
                                                {formatTime(message.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Message Input */}
                            <div className="p-4 border-t bg-white rounded-b-lg">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="default"
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                    >
                                        <Send className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
                                <p className="text-gray-500">
                                    Select a conversation to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
