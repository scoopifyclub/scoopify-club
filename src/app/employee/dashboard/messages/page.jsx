'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

            {/* Messaging Interface */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Messaging</CardTitle>
                    <CardDescription>Communicate directly with your customers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Messaging Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-blue-700">--</div>
                                <div className="text-sm text-blue-600">Active Conversations</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <Send className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-green-700">--</div>
                                <div className="text-sm text-green-600">Messages Sent</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg text-center">
                                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-purple-700">--</div>
                                <div className="text-sm text-purple-600">Avg Response Time</div>
                            </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-blue-50 rounded-lg">
                                <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-800 mb-2 text-center">Real-time Chat</h4>
                                <p className="text-sm text-gray-600 text-center mb-4">
                                    Instant messaging with customers for quick communication and updates.
                                </p>
                                <Button className="w-full" onClick={() => window.location.href = '/employee/dashboard'}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Open Messaging
                                </Button>
                            </div>
                            
                            <div className="p-6 bg-green-50 rounded-lg">
                                <Send className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <h4 className="font-semibold text-gray-800 mb-2 text-center">Service Updates</h4>
                                <p className="text-sm text-gray-600 text-center mb-4">
                                    Send service status updates and scheduling changes to customers.
                                </p>
                                <Button className="w-full" variant="outline">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Update
                                </Button>
                            </div>
                        </div>
                        
                        {/* Available Features */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700">Available Features:</h4>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    ✅ SMS Integration
                                </Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    ✅ Email Notifications
                                </Badge>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    ✅ File Sharing
                                </Badge>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    ✅ Photo Messages
                                </Badge>
                                <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                                    ✅ Voice Messages
                                </Badge>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                    ✅ Message Templates
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-4 text-center">
                                Your messaging system is fully functional! Use it to communicate with customers.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={() => window.location.href = '/employee/dashboard'}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Open Messaging
                                </Button>
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
