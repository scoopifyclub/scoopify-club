// Operational Tools Component
// For admin dashboard - bulk operations, automated reporting, customer support, system health monitoring
import React, { useState, useEffect } from 'react';
import { Settings, Users, FileText, MessageSquare, Activity, AlertTriangle, CheckCircle, Clock, Download, Upload, RefreshCw, BarChart3, Shield, Database, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const OperationalTools = ({
  onBulkOperation,
  onReportGenerate,
  onSupportAction,
  onSystemAction,
  className,
  ...props
}) => {
  const [toolsData, setToolsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bulk');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [reportType, setReportType] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [systemAction, setSystemAction] = useState('');

  // Mock data for demonstration
  const mockToolsData = {
    bulkOperations: {
      availableOperations: [
        { id: 'email', name: 'Send Email', description: 'Send email to selected customers', icon: 'MessageSquare' },
        { id: 'status', name: 'Update Status', description: 'Update customer subscription status', icon: 'Settings' },
        { id: 'export', name: 'Export Data', description: 'Export customer data to CSV', icon: 'Download' },
        { id: 'import', name: 'Import Data', description: 'Import customer data from CSV', icon: 'Upload' },
        { id: 'notify', name: 'Send Notifications', description: 'Send push notifications', icon: 'Activity' }
      ],
      recentOperations: [
        {
          id: '1',
          type: 'email',
          description: 'Sent payment reminder to 45 customers',
          status: 'completed',
          timestamp: '2024-01-15T10:30:00Z',
          affectedRecords: 45
        },
        {
          id: '2',
          type: 'export',
          description: 'Exported customer data for Q4 report',
          status: 'completed',
          timestamp: '2024-01-14T15:20:00Z',
          affectedRecords: 342
        }
      ]
    },
    reports: {
      availableReports: [
        { id: 'monthly', name: 'Monthly Business Report', description: 'Comprehensive monthly overview', schedule: 'monthly' },
        { id: 'weekly', name: 'Weekly Performance Report', description: 'Weekly metrics and KPIs', schedule: 'weekly' },
        { id: 'customer', name: 'Customer Analysis Report', description: 'Customer behavior and trends', schedule: 'monthly' },
        { id: 'employee', name: 'Employee Performance Report', description: 'Employee metrics and efficiency', schedule: 'weekly' },
        { id: 'financial', name: 'Financial Summary Report', description: 'Revenue, expenses, and profitability', schedule: 'monthly' }
      ],
      recentReports: [
        {
          id: '1',
          type: 'monthly',
          name: 'December 2023 Business Report',
          status: 'generated',
          timestamp: '2024-01-01T00:00:00Z',
          downloadUrl: '/reports/monthly-dec-2023.pdf'
        },
        {
          id: '2',
          type: 'weekly',
          name: 'Week 52 Performance Report',
          status: 'generated',
          timestamp: '2023-12-29T00:00:00Z',
          downloadUrl: '/reports/weekly-52-2023.pdf'
        }
      ],
      scheduledReports: [
        {
          id: '1',
          type: 'monthly',
          name: 'January 2024 Business Report',
          nextRun: '2024-02-01T00:00:00Z',
          status: 'scheduled'
        }
      ]
    },
    support: {
      recentTickets: [
        {
          id: '1',
          customerName: 'John Smith',
          subject: 'Service not completed on scheduled day',
          priority: 'high',
          status: 'open',
          timestamp: '2024-01-15T09:15:00Z',
          lastResponse: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          customerName: 'Sarah Johnson',
          subject: 'Payment method update needed',
          priority: 'medium',
          status: 'in_progress',
          timestamp: '2024-01-14T14:20:00Z',
          lastResponse: '2024-01-15T08:45:00Z'
        }
      ],
      quickActions: [
        { id: 'refund', name: 'Process Refund', description: 'Issue refund to customer' },
        { id: 'reschedule', name: 'Reschedule Service', description: 'Reschedule customer service' },
        { id: 'contact', name: 'Contact Customer', description: 'Send message to customer' },
        { id: 'escalate', name: 'Escalate Issue', description: 'Escalate to management' }
      ]
    },
    systemHealth: {
      status: 'healthy',
      uptime: 99.8,
      lastCheck: '2024-01-15T11:00:00Z',
      components: [
        { name: 'Database', status: 'healthy', responseTime: 45, uptime: 99.9 },
        { name: 'API Server', status: 'healthy', responseTime: 120, uptime: 99.8 },
        { name: 'Payment Gateway', status: 'healthy', responseTime: 200, uptime: 99.7 },
        { name: 'Email Service', status: 'warning', responseTime: 500, uptime: 98.5 },
        { name: 'File Storage', status: 'healthy', responseTime: 80, uptime: 99.9 }
      ],
      alerts: [
        {
          id: '1',
          type: 'warning',
          message: 'Email service response time increased',
          timestamp: '2024-01-15T10:45:00Z',
          resolved: false
        }
      ],
      metrics: {
        activeUsers: 156,
        requestsPerMinute: 245,
        averageResponseTime: 180,
        errorRate: 0.2
      }
    }
  };

  useEffect(() => {
    loadToolsData();
  }, []);

  const loadToolsData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToolsData(mockToolsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    try {
      await onBulkOperation?.(selectedOperation, selectedRecords);
    } catch (err) {
      console.error('Bulk operation failed:', err);
    }
  };

  const handleReportGenerate = async () => {
    try {
      await onReportGenerate?.(reportType);
    } catch (err) {
      console.error('Report generation failed:', err);
    }
  };

  const handleSupportAction = async (action) => {
    try {
      await onSupportAction?.(action, supportMessage);
    } catch (err) {
      console.error('Support action failed:', err);
    }
  };

  const handleSystemAction = async () => {
    try {
      await onSystemAction?.(systemAction);
    } catch (err) {
      console.error('System action failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      scheduled: 'outline',
      open: 'destructive',
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return <span className={cn("text-sm font-medium", colors[priority])}>{priority}</span>;
  };

  const renderBulkOperations = () => (
    <div className="space-y-6">
      {/* Available Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>Perform operations on multiple records at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation">Select Operation</Label>
              <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an operation" />
                </SelectTrigger>
                <SelectContent>
                  {toolsData.bulkOperations.availableOperations.map((operation) => (
                    <SelectItem key={operation.id} value={operation.id}>
                      {operation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedOperation && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">
                    {toolsData.bulkOperations.availableOperations.find(op => op.id === selectedOperation)?.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {toolsData.bulkOperations.availableOperations.find(op => op.id === selectedOperation)?.description}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="records">Select Records (comma-separated IDs)</Label>
                  <Input
                    id="records"
                    placeholder="1, 2, 3, 4, 5"
                    value={selectedRecords.join(', ')}
                    onChange={(e) => setSelectedRecords(e.target.value.split(',').map(id => id.trim()))}
                  />
                </div>
                
                <Button onClick={handleBulkOperation} className="w-full">
                  Execute Operation
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsData.bulkOperations.recentOperations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{operation.description}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(operation.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{operation.affectedRecords} records</span>
                  {getStatusBadge(operation.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Generate Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Create and schedule automated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {toolsData.reports.availableReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {reportType && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">
                  {toolsData.reports.availableReports.find(r => r.id === reportType)?.name}
                </div>
                <div className="text-sm text-gray-600">
                  {toolsData.reports.availableReports.find(r => r.id === reportType)?.description}
                </div>
              </div>
            )}
            
            <Button onClick={handleReportGenerate} className="w-full">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsData.reports.recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(report.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(report.status)}
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsData.reports.scheduledReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-gray-600">
                    Next run: {new Date(report.nextRun).toLocaleString()}
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Support Actions</CardTitle>
          <CardDescription>Common customer support operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toolsData.support.quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => handleSupportAction(action.id)}
              >
                <div className="font-medium">{action.name}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsData.support.recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{ticket.customerName}</div>
                    <div className="text-sm text-gray-600">{ticket.subject}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(ticket.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Send Message */}
      <Card>
        <CardHeader>
          <CardTitle>Send Support Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supportMessage">Message</Label>
              <Textarea
                id="supportMessage"
                placeholder="Enter your support message..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={() => handleSupportAction('message')} className="w-full">
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemHealth = () => (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{toolsData.systemHealth.uptime}%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{toolsData.systemHealth.metrics.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{toolsData.systemHealth.metrics.requestsPerMinute}</div>
              <div className="text-sm text-gray-600">Requests/min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{toolsData.systemHealth.metrics.errorRate}%</div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsData.systemHealth.components.map((component) => (
              <div key={component.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{component.name}</div>
                    <div className="text-sm text-gray-600">
                      Response: {component.responseTime}ms
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{component.uptime}% uptime</div>
                  </div>
                  {getStatusBadge(component.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsData.systemHealth.alerts.length > 0 ? (
              toolsData.systemHealth.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Resolve
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                No active alerts
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="systemAction">Select Action</Label>
              <Select value={systemAction} onValueChange={setSystemAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a system action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backup">Create Database Backup</SelectItem>
                  <SelectItem value="cache">Clear Cache</SelectItem>
                  <SelectItem value="logs">Download Logs</SelectItem>
                  <SelectItem value="restart">Restart Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {systemAction && (
              <Button onClick={handleSystemAction} className="w-full" variant="outline">
                Execute System Action
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading operational tools..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error loading tools: {error}</div>
        <Button onClick={loadToolsData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operational Tools</h2>
          <p className="text-gray-600">Bulk operations, reporting, support, and system management</p>
        </div>
        <Button onClick={loadToolsData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-6">
          {renderBulkOperations()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {renderReports()}
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          {renderSupport()}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {renderSystemHealth()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationalTools; 