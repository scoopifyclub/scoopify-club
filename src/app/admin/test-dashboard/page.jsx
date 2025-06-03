"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    RefreshCw,
    Users,
    Calendar,
    DollarSign,
    Settings,
    FileText,
    AlertTriangle
} from 'lucide-react';

export default function AdminDashboardTestPage() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allPassed, setAllPassed] = useState(false);

    const adminEndpoints = [
        { name: 'Admin Verify', url: '/api/admin/verify', method: 'GET' },
        { name: 'Admin Stats', url: '/api/admin/stats', method: 'GET' },
        { name: 'Admin Dashboard', url: '/api/admin/dashboard', method: 'GET' },
        { name: 'Admin Services', url: '/api/admin/services', method: 'GET' },
        { name: 'Admin Customers', url: '/api/admin/customers', method: 'GET' },
        { name: 'Admin Employees', url: '/api/admin/employees', method: 'GET' },
        { name: 'Admin Payments', url: '/api/admin/payments', method: 'GET' },
    ];

    const adminPages = [
        { name: 'Dashboard Overview', url: '/admin/dashboard/overview' },
        { name: 'Customers', url: '/admin/dashboard/customers' },
        { name: 'Employees', url: '/admin/dashboard/employees' },
        { name: 'Services', url: '/admin/dashboard/services' },
        { name: 'Payments', url: '/admin/dashboard/payments' },
        { name: 'Reports', url: '/admin/dashboard/reports' },
        { name: 'Settings', url: '/admin/dashboard/settings' },
    ];

    const runAllTests = async () => {
        setLoading(true);
        setTests([]);
        const testResults = [];

        // Test API endpoints
        for (const endpoint of adminEndpoints) {
            try {
                const startTime = Date.now();
                const response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const endTime = Date.now();
                const responseTime = endTime - startTime;

                let data = null;
                try {
                    data = await response.json();
                } catch (e) {
                    // Response might not be JSON
                }

                testResults.push({
                    type: 'api',
                    name: endpoint.name,
                    url: endpoint.url,
                    status: response.ok ? 'passed' : 'failed',
                    statusCode: response.status,
                    responseTime,
                    error: response.ok ? null : (data?.error || response.statusText),
                    hasData: response.ok && data ? Object.keys(data).length > 0 : false
                });

            } catch (error) {
                testResults.push({
                    type: 'api',
                    name: endpoint.name,
                    url: endpoint.url,
                    status: 'failed',
                    statusCode: null,
                    responseTime: null,
                    error: error.message,
                    hasData: false
                });
            }
        }

        // Test page accessibility (just check if they exist)
        for (const page of adminPages) {
            try {
                const response = await fetch(page.url, {
                    method: 'HEAD',
                    credentials: 'include'
                });

                testResults.push({
                    type: 'page',
                    name: page.name,
                    url: page.url,
                    status: response.ok ? 'passed' : 'failed',
                    statusCode: response.status,
                    error: response.ok ? null : response.statusText
                });

            } catch (error) {
                testResults.push({
                    type: 'page',
                    name: page.name,
                    url: page.url,
                    status: 'failed',
                    statusCode: null,
                    error: error.message
                });
            }
        }

        setTests(testResults);
        
        const passed = testResults.filter(test => test.status === 'passed').length;
        const total = testResults.length;
        setAllPassed(passed === total);
        
        if (passed === total) {
            toast.success(`All ${total} tests passed! Admin dashboard is fully functional.`);
        } else {
            toast.error(`${passed}/${total} tests passed. Some issues need attention.`);
        }
        
        setLoading(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'passed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'pending': 'bg-gray-100 text-gray-800'
        };
        
        return (
            <Badge className={colors[status] || colors.pending}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    const apiTests = tests.filter(test => test.type === 'api');
    const pageTests = tests.filter(test => test.type === 'page');
    const passedTests = tests.filter(test => test.status === 'passed').length;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Admin Dashboard Test Suite</h1>
                <p className="text-gray-600">Comprehensive testing of all admin dashboard functionality</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Tests Passed</p>
                                <p className="text-xl font-bold">{passedTests}/{tests.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Users className="h-6 w-6 text-blue-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">API Endpoints</p>
                                <p className="text-xl font-bold">{apiTests.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <FileText className="h-6 w-6 text-purple-600" />
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Dashboard Pages</p>
                                <p className="text-xl font-bold">{pageTests.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            {allPassed ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            )}
                            <div className="ml-2">
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="text-xl font-bold">{allPassed ? 'Ready' : 'Issues'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="mb-6">
                <Button 
                    onClick={runAllTests} 
                    disabled={loading}
                    className="mr-4"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Running Tests...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Run All Tests
                        </>
                    )}
                </Button>
                
                {tests.length > 0 && (
                    <span className="text-sm text-gray-600">
                        Last run: {new Date().toLocaleString()}
                    </span>
                )}
            </div>

            {/* API Tests */}
            {apiTests.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            API Endpoint Tests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {apiTests.map((test, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(test.status)}
                                        <div>
                                            <h3 className="font-medium">{test.name}</h3>
                                            <p className="text-sm text-gray-600">{test.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {test.responseTime && (
                                            <span className="text-sm text-gray-500">
                                                {test.responseTime}ms
                                            </span>
                                        )}
                                        {test.statusCode && (
                                            <Badge variant="outline">
                                                {test.statusCode}
                                            </Badge>
                                        )}
                                        {getStatusBadge(test.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Page Tests */}
            {pageTests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Dashboard Page Tests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pageTests.map((test, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(test.status)}
                                        <div>
                                            <h3 className="font-medium">{test.name}</h3>
                                            <p className="text-sm text-gray-600">{test.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {test.statusCode && (
                                            <Badge variant="outline">
                                                {test.statusCode}
                                            </Badge>
                                        )}
                                        {getStatusBadge(test.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Details */}
            {tests.some(test => test.status === 'failed') && (
                <Card className="mt-6 border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <XCircle className="h-5 w-5" />
                            Failed Tests Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tests.filter(test => test.status === 'failed').map((test, index) => (
                                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <h3 className="font-medium text-red-800">{test.name}</h3>
                                    <p className="text-sm text-red-600 mt-1">{test.error}</p>
                                    <p className="text-sm text-gray-600 mt-1">{test.url}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {tests.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Ready to Test</h3>
                        <p className="text-gray-500">Click "Run All Tests" to verify admin dashboard functionality.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 