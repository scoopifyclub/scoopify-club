'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, User, Clock, Search, Phone, Mail, AlertCircle } from 'lucide-react';

// Force dynamic rendering for employee pages
export const dynamic = 'force-dynamic';

export default function EmployeeMessagesPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for UI consistency
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

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
                                <p className="text-2xl font-bold">0</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Send className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                                <p className="text-2xl font-bold">0</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                                <p className="text-2xl font-bold">--</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Coming Soon Interface */}
            <Card>
                <CardContent className="p-12">
                    <div className="text-center">
                        <MessageCircle className="h-24 w-24 text-blue-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-700 mb-4">Messaging System Coming Soon</h3>
                        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                            We're building a comprehensive messaging system that will allow you to communicate directly 
                            with your customers, manage service updates, and handle scheduling changes all in one place.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-6 bg-blue-50 rounded-lg">
                                <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-800 mb-2">Real-time Chat</h4>
                                <p className="text-sm text-gray-600">
                                    Instant messaging with customers for quick communication and updates.
                                </p>
                            </div>
                            
                            <div className="p-6 bg-green-50 rounded-lg">
                                <Send className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-800 mb-2">Automated Notifications</h4>
                                <p className="text-sm text-gray-600">
                                    Automatic service reminders and updates sent to customers.
                                </p>
                            </div>
                            
                            <div className="p-6 bg-purple-50 rounded-lg">
                                <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-800 mb-2">Message History</h4>
                                <p className="text-sm text-gray-600">
                                    Complete conversation history with search and filtering capabilities.
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700">Features in Development:</h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    SMS Integration
                                </Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Email Notifications
                                </Badge>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    File Sharing
                                </Badge>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    Photo Messages
                                </Badge>
                                <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                                    Voice Messages
                                </Badge>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                    Message Templates
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-4">
                                In the meantime, you can contact customers directly:
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Use Phone
                                </Button>
                                <Button variant="outline">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
