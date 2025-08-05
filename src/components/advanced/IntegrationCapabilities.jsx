// Integration Capabilities Component
// For advanced features - third-party integrations, API, webhooks, data tools
import React, { useState, useEffect } from 'react';
import { Link, Code, Webhook, Download, Upload, Settings, Shield, Activity, Database, Zap, Globe, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const IntegrationCapabilities = ({
  onIntegrationCreate,
  onApiKeyGenerate,
  onWebhookManage,
  onDataExport,
  onDataImport,
  className,
  ...props
}) => {
  const [integrationData, setIntegrationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('integrations');
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Mock data for demonstration
  const mockIntegrationData = {
    thirdPartyIntegrations: [
      {
        id: '1',
        name: 'QuickBooks',
        type: 'accounting',
        status: 'active',
        description: 'Sync financial data and invoices',
        apiKey: 'qbk_****_****_****',
        lastSync: '2024-01-15T10:30:00Z',
        syncFrequency: 'daily',
        features: ['invoice_sync', 'payment_tracking', 'expense_management']
      },
      {
        id: '2',
        name: 'Google Calendar',
        type: 'scheduling',
        status: 'active',
        description: 'Sync service appointments and schedules',
        apiKey: 'gcal_****_****_****',
        lastSync: '2024-01-15T09:15:00Z',
        syncFrequency: 'real_time',
        features: ['appointment_sync', 'calendar_integration', 'reminder_sync']
      },
      {
        id: '3',
        name: 'Mailchimp',
        type: 'marketing',
        status: 'inactive',
        description: 'Email marketing and customer communication',
        apiKey: 'mc_****_****_****',
        lastSync: '2024-01-10T14:20:00Z',
        syncFrequency: 'weekly',
        features: ['email_campaigns', 'customer_segments', 'automation']
      },
      {
        id: '4',
        name: 'Zapier',
        type: 'automation',
        status: 'active',
        description: 'Automate workflows and data flow',
        apiKey: 'zap_****_****_****',
        lastSync: '2024-01-15T11:00:00Z',
        syncFrequency: 'real_time',
        features: ['workflow_automation', 'data_sync', 'trigger_actions']
      }
    ],
    apiManagement: {
      apiKeys: [
        {
          id: '1',
          name: 'Production API Key',
          key: 'sk_prod_****_****_****_****',
          status: 'active',
          permissions: ['read', 'write', 'admin'],
          createdAt: '2024-01-01T00:00:00Z',
          lastUsed: '2024-01-15T12:30:00Z',
          usage: {
            requests: 15420,
            bandwidth: '2.3 GB',
            errors: 23
          }
        },
        {
          id: '2',
          name: 'Development API Key',
          key: 'sk_dev_****_****_****_****',
          status: 'active',
          permissions: ['read', 'write'],
          createdAt: '2024-01-10T00:00:00Z',
          lastUsed: '2024-01-15T08:45:00Z',
          usage: {
            requests: 3240,
            bandwidth: '0.5 GB',
            errors: 5
          }
        }
      ],
      endpoints: [
        {
          path: '/api/v1/customers',
          method: 'GET',
          description: 'Retrieve customer list',
          rateLimit: '1000/hour',
          status: 'active'
        },
        {
          path: '/api/v1/services',
          method: 'POST',
          description: 'Create new service',
          rateLimit: '100/hour',
          status: 'active'
        },
        {
          path: '/api/v1/payments',
          method: 'GET',
          description: 'Get payment history',
          rateLimit: '500/hour',
          status: 'active'
        },
        {
          path: '/api/v1/webhooks',
          method: 'POST',
          description: 'Manage webhooks',
          rateLimit: '50/hour',
          status: 'active'
        }
      ],
      documentation: {
        baseUrl: 'https://api.scoopifyclub.com/v1',
        authentication: 'Bearer token',
        rateLimits: '1000 requests per hour',
        version: '1.0.0'
      }
    },
    webhookSystem: {
      webhooks: [
        {
          id: '1',
          name: 'Payment Success',
          url: 'https://webhook.site/abc123',
          events: ['payment.succeeded', 'payment.failed'],
          status: 'active',
          lastTriggered: '2024-01-15T11:30:00Z',
          successRate: 98.5,
          retryCount: 3
        },
        {
          id: '2',
          name: 'Service Completed',
          url: 'https://api.example.com/webhooks/service',
          events: ['service.completed', 'service.cancelled'],
          status: 'active',
          lastTriggered: '2024-01-15T10:15:00Z',
          successRate: 99.2,
          retryCount: 3
        },
        {
          id: '3',
          name: 'Customer Created',
          url: 'https://crm.example.com/webhook',
          events: ['customer.created', 'customer.updated'],
          status: 'inactive',
          lastTriggered: '2024-01-14T16:45:00Z',
          successRate: 95.8,
          retryCount: 3
        }
      ],
      events: [
        'payment.succeeded',
        'payment.failed',
        'service.scheduled',
        'service.completed',
        'service.cancelled',
        'customer.created',
        'customer.updated',
        'subscription.created',
        'subscription.cancelled'
      ]
    },
    dataTools: {
      exportFormats: ['JSON', 'CSV', 'XML', 'PDF'],
      importFormats: ['JSON', 'CSV', 'Excel'],
      recentExports: [
        {
          id: '1',
          type: 'customer_data',
          format: 'CSV',
          size: '2.3 MB',
          status: 'completed',
          createdAt: '2024-01-15T09:30:00Z',
          downloadUrl: '/exports/customers_2024-01-15.csv'
        },
        {
          id: '2',
          type: 'service_history',
          format: 'JSON',
          size: '1.8 MB',
          status: 'completed',
          createdAt: '2024-01-14T15:20:00Z',
          downloadUrl: '/exports/services_2024-01-14.json'
        },
        {
          id: '3',
          type: 'financial_report',
          format: 'PDF',
          size: '0.5 MB',
          status: 'processing',
          createdAt: '2024-01-15T12:00:00Z',
          downloadUrl: null
        }
      ],
      recentImports: [
        {
          id: '1',
          type: 'customer_import',
          format: 'CSV',
          size: '1.2 MB',
          status: 'completed',
          records: 156,
          createdAt: '2024-01-15T08:15:00Z'
        },
        {
          id: '2',
          type: 'service_data',
          format: 'Excel',
          size: '0.8 MB',
          status: 'failed',
          records: 0,
          createdAt: '2024-01-14T14:30:00Z',
          error: 'Invalid data format'
        }
      ]
    }
  };

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIntegrationData(mockIntegrationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationCreate = async () => {
    try {
      await onIntegrationCreate?.(selectedIntegration);
    } catch (err) {
      console.error('Integration creation failed:', err);
    }
  };

  const handleApiKeyGenerate = async () => {
    try {
      await onApiKeyGenerate?.();
    } catch (err) {
      console.error('API key generation failed:', err);
    }
  };

  const handleWebhookManage = async (action, webhookId) => {
    try {
      await onWebhookManage?.(action, webhookId);
    } catch (err) {
      console.error('Webhook management failed:', err);
    }
  };

  const handleDataExport = async (type, format) => {
    try {
      await onDataExport?.(type, format);
    } catch (err) {
      console.error('Data export failed:', err);
    }
  };

  const handleDataImport = async (file, type) => {
    try {
      await onDataImport?.(file, type);
    } catch (err) {
      console.error('Data import failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      processing: 'outline',
      completed: 'default',
      failed: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const renderThirdPartyIntegrations = () => (
    <div className="space-y-6">
      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrationData.thirdPartyIntegrations.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrationData.thirdPartyIntegrations.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Date(integrationData.thirdPartyIntegrations[0].lastSync).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sync Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">98.5%</div>
          </CardContent>
        </Card>
      </div>

      {/* Integration List */}
      <Card>
        <CardHeader>
          <CardTitle>Third-Party Integrations</CardTitle>
          <CardDescription>Manage external service connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationData.thirdPartyIntegrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-gray-600">{integration.description}</div>
                    <div className="text-xs text-gray-500">
                      Last sync: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{integration.syncFrequency}</div>
                  <div className="text-sm font-medium">{integration.apiKey}</div>
                  {getStatusBadge(integration.status)}
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>Connect with popular services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Slack', 'Microsoft Teams', 'Trello', 'Asana', 'HubSpot', 'Salesforce'].map((service) => (
              <div key={service} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{service}</div>
                  <div className="text-sm text-gray-600">Connect {service} to Scoopify</div>
                </div>
                <Button size="sm" variant="outline">
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderApiManagement = () => (
    <div className="space-y-6">
      {/* API Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrationData.apiManagement.apiKeys.filter(k => k.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrationData.apiManagement.apiKeys.reduce((sum, key) => sum + key.usage.requests, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {integrationData.apiManagement.endpoints.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {((integrationData.apiManagement.apiKeys.reduce((sum, key) => sum + key.usage.errors, 0) / 
                 integrationData.apiManagement.apiKeys.reduce((sum, key) => sum + key.usage.requests, 0)) * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage API access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationData.apiManagement.apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="text-sm text-gray-600">{apiKey.key}</div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{apiKey.usage.requests.toLocaleString()} requests</div>
                  <div className="text-sm text-gray-600">{apiKey.usage.bandwidth}</div>
                  {getStatusBadge(apiKey.status)}
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">
                      Regenerate
                    </Button>
                    <Button size="sm" variant="outline">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={handleApiKeyGenerate} className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Generate New API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Available API endpoints and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationData.apiManagement.endpoints.map((endpoint) => (
              <div key={endpoint.path} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{endpoint.method} {endpoint.path}</div>
                  <div className="text-sm text-gray-600">{endpoint.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{endpoint.rateLimit}</div>
                  {getStatusBadge(endpoint.status)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="font-medium">API Documentation</div>
            <div className="text-sm text-gray-600">
              Base URL: {integrationData.apiManagement.documentation.baseUrl}
            </div>
            <div className="text-sm text-gray-600">
              Authentication: {integrationData.apiManagement.documentation.authentication}
            </div>
            <div className="text-sm text-gray-600">
              Rate Limits: {integrationData.apiManagement.documentation.rateLimits}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWebhookSystem = () => (
    <div className="space-y-6">
      {/* Webhook Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrationData.webhookSystem.webhooks.filter(w => w.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrationData.webhookSystem.events.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(integrationData.webhookSystem.webhooks.reduce((sum, w) => sum + w.successRate, 0) / 
                integrationData.webhookSystem.webhooks.length).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Last Triggered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {new Date(integrationData.webhookSystem.webhooks[0].lastTriggered).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook List */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Manage webhook endpoints and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationData.webhookSystem.webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{webhook.name}</div>
                  <div className="text-sm text-gray-600">{webhook.url}</div>
                  <div className="text-xs text-gray-500">
                    Events: {webhook.events.join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{webhook.successRate}% success</div>
                  <div className="text-sm text-gray-600">
                    Last: {new Date(webhook.lastTriggered).toLocaleString()}
                  </div>
                  {getStatusBadge(webhook.status)}
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">
                      Test
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-2">Create New Webhook</div>
              <div className="space-y-2">
                <Input placeholder="Webhook name" />
                <Input placeholder="Webhook URL" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select events" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationData.webhookSystem.events.map((event) => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => handleWebhookManage('create')} className="w-full">
                  Create Webhook
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Events */}
      <Card>
        <CardHeader>
          <CardTitle>Available Events</CardTitle>
          <CardDescription>Events that can trigger webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {integrationData.webhookSystem.events.map((event) => (
              <div key={event} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{event}</span>
                <Badge variant="outline" className="text-xs">Available</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataTools = () => (
    <div className="space-y-6">
      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Export Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrationData.dataTools.exportFormats.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Import Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrationData.dataTools.importFormats.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {integrationData.dataTools.recentExports.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {integrationData.dataTools.recentImports.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Export data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-2">Export Type</div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">Customer Data</SelectItem>
                    <SelectItem value="services">Service History</SelectItem>
                    <SelectItem value="payments">Payment Records</SelectItem>
                    <SelectItem value="employees">Employee Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="font-medium mb-2">Format</div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationData.dataTools.exportFormats.map((format) => (
                      <SelectItem key={format} value={format}>{format}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleDataExport('customers', 'CSV')} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationData.dataTools.recentExports.map((export_) => (
              <div key={export_.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{export_.type.replace('_', ' ').toUpperCase()}</div>
                  <div className="text-sm text-gray-600">{export_.format} • {export_.size}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(export_.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(export_.status)}
                  {export_.downloadUrl && (
                    <Button size="sm" variant="outline" className="mt-2">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <CardTitle>Data Import</CardTitle>
          <CardDescription>Import data from external sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-2">Import Type</div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select import type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">Customer Import</SelectItem>
                    <SelectItem value="services">Service Data</SelectItem>
                    <SelectItem value="payments">Payment Records</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="font-medium mb-2">File Upload</div>
                <Input type="file" accept=".csv,.json,.xlsx" />
              </div>
            </div>
            <Button onClick={() => handleDataImport('file', 'customers')} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationData.dataTools.recentImports.map((import_) => (
              <div key={import_.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{import_.type.replace('_', ' ').toUpperCase()}</div>
                  <div className="text-sm text-gray-600">{import_.format} • {import_.size}</div>
                  <div className="text-xs text-gray-500">
                    {import_.records} records • {new Date(import_.createdAt).toLocaleString()}
                  </div>
                  {import_.error && (
                    <div className="text-xs text-red-600">Error: {import_.error}</div>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(import_.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading integration capabilities..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error loading integrations: {error}</div>
        <Button onClick={loadIntegrationData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Capabilities</h2>
          <p className="text-gray-600">Third-party integrations, API management, webhooks, and data tools</p>
        </div>
        <Button onClick={loadIntegrationData} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API Management</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="data">Data Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {renderThirdPartyIntegrations()}
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {renderApiManagement()}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          {renderWebhookSystem()}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {renderDataTools()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationCapabilities; 