'use client';
import { useState } from 'react';

export default function APIDocs() {
    const [activeSection, setActiveSection] = useState('overview');

    const apiEndpoints = [
        {
            method: 'GET',
            path: '/api/customer/services',
            description: 'Get customer services',
            auth: 'Bearer Token Required',
            params: ['page', 'limit']
        },
        {
            method: 'POST',
            path: '/api/customer/services',
            description: 'Create a new service',
            auth: 'Bearer Token Required',
            body: ['servicePlanId', 'scheduledDate', 'locationId', 'notes']
        },
        {
            method: 'GET',
            path: '/api/customer/payments',
            description: 'Get customer payments',
            auth: 'Bearer Token Required',
            params: ['page', 'limit', 'status', 'startDate', 'endDate']
        },
        {
            method: 'POST',
            path: '/api/customer/payments',
            description: 'Create a new payment',
            auth: 'Bearer Token Required',
            body: ['amount', 'serviceId', 'paymentMethodId']
        },
        {
            method: 'GET',
            path: '/api/admin/automation-status',
            description: 'Get automation system status',
            auth: 'Admin Required'
        },
        {
            method: 'POST',
            path: '/api/admin/trigger-automation',
            description: 'Manually trigger automation',
            auth: 'Admin Required',
            body: ['type']
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveSection('overview')}
                        className={`px-4 py-2 rounded ${activeSection === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveSection('endpoints')}
                        className={`px-4 py-2 rounded ${activeSection === 'endpoints' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Endpoints
                    </button>
                    <button
                        onClick={() => setActiveSection('auth')}
                        className={`px-4 py-2 rounded ${activeSection === 'auth' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Authentication
                    </button>
                </div>

                {activeSection === 'overview' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">API Overview</h2>
                        <p className="mb-4">
                            The Scoopify Club API provides endpoints for managing services, payments, and business automation.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded">
                                <h3 className="font-semibold">Base URL</h3>
                                <code className="text-sm">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</code>
                            </div>
                            <div className="bg-green-50 p-4 rounded">
                                <h3 className="font-semibold">Format</h3>
                                <p className="text-sm">JSON</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded">
                                <h3 className="font-semibold">Version</h3>
                                <p className="text-sm">v1.0.0</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'endpoints' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
                        <div className="space-y-4">
                            {apiEndpoints.map((endpoint, index) => (
                                <div key={index} className="border rounded p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                                            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                                            endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {endpoint.method}
                                        </span>
                                        <code className="text-sm font-mono">{endpoint.path}</code>
                                    </div>
                                    <p className="text-gray-600 mb-2">{endpoint.description}</p>
                                    <div className="text-sm">
                                        <span className="font-semibold">Auth:</span> {endpoint.auth}
                                    </div>
                                    {endpoint.params && (
                                        <div className="text-sm mt-1">
                                            <span className="font-semibold">Parameters:</span> {endpoint.params.join(', ')}
                                        </div>
                                    )}
                                    {endpoint.body && (
                                        <div className="text-sm mt-1">
                                            <span className="font-semibold">Body:</span> {endpoint.body.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'auth' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">Bearer Token Authentication</h3>
                                <p className="mb-2">Most endpoints require authentication using a Bearer token in the Authorization header:</p>
                                <code className="bg-gray-100 p-2 rounded block text-sm">
                                    Authorization: Bearer YOUR_TOKEN_HERE
                                </code>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">Admin Authentication</h3>
                                <p>Admin endpoints require additional admin privileges beyond regular user authentication.</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">Rate Limiting</h3>
                                <p>API endpoints are rate-limited to 100 requests per minute per IP address.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
