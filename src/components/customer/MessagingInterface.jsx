'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagingInterface({ service, scooper }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize conversation when component mounts
    useEffect(() => {
        if (service && scooper) {
            initializeConversation();
        }
    }, [service, scooper]);

    const initializeConversation = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/messaging/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: scooper.id,
                    serviceId: service.id,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initialize conversation');
            }

            const data = await response.json();
            setConversation(data.conversation);
            
            // Load existing messages
            if (data.conversation.id) {
                loadMessages(data.conversation.id);
            }
        } catch (error) {
            console.error('Error initializing conversation:', error);
            toast.error('Failed to start conversation');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const data = await response.json();
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !conversation) return;

        try {
            setSending(true);
            const response = await fetch(`/api/messaging/conversations/${conversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    messageType: 'TEXT',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            setMessages(prev => [...prev, data.message]);
            setNewMessage('');
            
            // Refresh conversation to update last message time
            if (conversation) {
                loadMessages(conversation.id);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!service || !scooper) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Messaging Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                variant="default"
            >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isOpen ? 'Close Chat' : 'Message Scooper'}
                {messages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                        {messages.length}
                    </Badge>
                )}
            </Button>

            {/* Messaging Interface */}
            {isOpen && (
                <Card className="shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={scooper.user?.image} alt={scooper.user?.name} />
                                <AvatarFallback>
                                    {scooper.user?.name?.charAt(0) || 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-lg">{scooper.user?.name}</CardTitle>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(service.scheduledDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {service.servicePlan?.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {/* Messages Area */}
                        <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-3 bg-gray-50">
                            {loading ? (
                                <div className="text-center text-gray-500">Loading conversation...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-500">
                                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p>Start a conversation with {scooper.user?.name}</p>
                                    <p className="text-sm">Ask questions, provide updates, or share special instructions</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.senderId === scooper.userId ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-xs px-3 py-2 rounded-lg ${
                                                    message.senderId === scooper.userId
                                                        ? 'bg-white border text-gray-800'
                                                        : 'bg-blue-600 text-white'
                                                }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.senderId === scooper.userId
                                                        ? 'text-gray-500'
                                                        : 'text-blue-100'
                                                }`}>
                                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="flex space-x-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={sending || !conversation}
                                className="flex-1"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={sending || !newMessage.trim() || !conversation}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => {
                                        const message = "Hi! I have a question about my service today.";
                                        setNewMessage(message);
                                    }}
                                >
                                    Ask Question
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => {
                                        const message = "Please let me know when you arrive!";
                                        setNewMessage(message);
                                    }}
                                >
                                    Arrival Update
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
