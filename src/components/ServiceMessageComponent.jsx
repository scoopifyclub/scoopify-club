'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function ServiceMessageComponent({ serviceId }) {
    const { user, loading } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);

    useEffect(() => {
        if (user?.id && serviceId) {
            fetchMessages();
        }
    }, [user, serviceId]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`/api/services/${serviceId}/messages`, {
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

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`/api/services/${serviceId}/messages`, {
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

    if (loading || loadingMessages) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <Card className="p-4">
            <ScrollArea className="h-[300px] pr-4 mb-4">
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <p className="text-center text-gray-500">No messages yet</p>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`p-3 rounded-lg ${
                                    message.senderId === user.id
                                        ? 'bg-primary text-white ml-auto'
                                        : 'bg-gray-100'
                                } max-w-[80%]`}
                            >
                                <p className="text-sm font-medium">
                                    {message.senderId === user.id ? 'You' : message.senderName}
                                </p>
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {new Date(message.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                    Send
                </Button>
            </form>
        </Card>
    );
}
