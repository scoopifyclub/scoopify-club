// Automation and AI Component
// For advanced features - smart scheduling, predictive maintenance, customer behavior analysis, automated customer service
import React, { useState, useEffect } from 'react';
import { Brain, Calendar, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, Settings, BarChart3, Activity, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const AutomationAI = ({
  onScheduleOptimize,
  onMaintenancePredict,
  onBehaviorAnalyze,
  onAutoService,
  className,
  ...props
}) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scheduling');
  const [selectedOptimization, setSelectedOptimization] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState('');

  // Mock data for demonstration
  const mockAiData = {
    smartScheduling: {
      currentEfficiency: 78.5,
      optimizedEfficiency: 92.3,
      improvements: [
        {
          id: '1',
          type: 'route_optimization',
          description: 'Optimize daily routes to reduce travel time',
          impact: '15% time savings',
          status: 'implemented',
          savings: 2.5
        },
        {
          id: '2',
          type: 'load_balancing',
          description: 'Balance service load across employees',
          impact: '20% efficiency increase',
          status: 'pending',
          savings: 3.2
        },
        {
          id: '3',
          type: 'weather_adjustment',
          description: 'Adjust schedules based on weather forecasts',
          impact: '10% cancellation reduction',
          status: 'implemented',
          savings: 1.8
        }
      ],
      recommendations: [
        {
          id: '1',
          priority: 'high',
          action: 'Reschedule John Smith to cover downtown area',
          reason: 'Reduces travel time by 45 minutes',
          estimatedSavings: 1.2
        },
        {
          id: '2',
          priority: 'medium',
          action: 'Group services in North Peyton area',
          reason: 'Optimizes route efficiency',
          estimatedSavings: 0.8
        }
      ]
    },
    predictiveMaintenance: {
      equipmentHealth: {
        overall: 87.5,
        vehicles: 92.0,
        tools: 85.0,
        software: 89.0
      },
      maintenanceSchedule: [
        {
          id: '1',
          equipment: 'Vehicle #1',
          type: 'preventive',
          dueDate: '2024-01-25T00:00:00Z',
          priority: 'medium',
          estimatedCost: 150.00,
          description: 'Oil change and filter replacement'
        },
        {
          id: '2',
          equipment: 'GPS System',
          type: 'software_update',
          dueDate: '2024-01-20T00:00:00Z',
          priority: 'low',
          estimatedCost: 0.00,
          description: 'System software update'
        },
        {
          id: '3',
          equipment: 'Pooper Scooper #3',
          type: 'repair',
          dueDate: '2024-01-18T00:00:00Z',
          priority: 'high',
          estimatedCost: 75.00,
          description: 'Handle replacement needed'
        }
      ],
      predictions: [
        {
          id: '1',
          equipment: 'Vehicle #2',
          issue: 'Brake wear detected',
          probability: 85,
          estimatedFailure: '2024-02-15T00:00:00Z',
          recommendedAction: 'Schedule brake inspection'
        }
      ]
    },
    customerBehavior: {
      patterns: [
        {
          id: '1',
          pattern: 'Seasonal Service Changes',
          description: 'Customers increase service frequency in spring',
          confidence: 92,
          impact: 'Revenue increase 25%',
          recommendation: 'Prepare for spring marketing campaign'
        },
        {
          id: '2',
          pattern: 'Payment Timing',
          description: 'Most payments occur between 1st-5th of month',
          confidence: 88,
          impact: 'Cash flow optimization',
          recommendation: 'Schedule payment reminders for 28th-30th'
        },
        {
          id: '3',
          pattern: 'Service Cancellation',
          description: 'Cancellations peak on rainy days',
          confidence: 76,
          impact: 'Reduce cancellations by 40%',
          recommendation: 'Implement weather-based rescheduling'
        }
      ],
      segments: [
        {
          id: '1',
          name: 'High-Value Loyal',
          count: 45,
          characteristics: 'Consistent payments, high satisfaction',
          lifetimeValue: 2500,
          churnRisk: 'Low'
        },
        {
          id: '2',
          name: 'Seasonal Users',
          count: 78,
          characteristics: 'Service frequency varies by season',
          lifetimeValue: 1200,
          churnRisk: 'Medium'
        },
        {
          id: '3',
          name: 'At-Risk Customers',
          count: 23,
          characteristics: 'Late payments, service complaints',
          lifetimeValue: 800,
          churnRisk: 'High'
        }
      ]
    },
    automatedService: {
      chatbots: [
        {
          id: '1',
          name: 'Service Scheduler Bot',
          status: 'active',
          conversations: 156,
          resolutionRate: 78.5,
          avgResponseTime: 2.3,
          topics: ['scheduling', 'rescheduling', 'service questions']
        },
        {
          id: '2',
          name: 'Payment Assistant Bot',
          status: 'active',
          conversations: 89,
          resolutionRate: 85.2,
          avgResponseTime: 1.8,
          topics: ['payment methods', 'billing questions', 'refunds']
        }
      ],
      autoResponses: [
        {
          id: '1',
          trigger: 'service_confirmation',
          response: 'Your service has been confirmed for {{date}} at {{time}}. We\'ll send a reminder 24 hours before.',
          usage: 234,
          effectiveness: 92.3
        },
        {
          id: '2',
          trigger: 'payment_reminder',
          response: 'Hi {{name}}, your payment of ${{amount}} is due on {{due_date}}. Please update your payment method if needed.',
          usage: 156,
          effectiveness: 87.6
        },
        {
          id: '3',
          trigger: 'weather_delay',
          response: 'Due to weather conditions, we may need to reschedule your service. We\'ll contact you within 2 hours.',
          usage: 45,
          effectiveness: 94.1
        }
      ],
      workflows: [
        {
          id: '1',
          name: 'New Customer Onboarding',
          status: 'active',
          steps: 5,
          completionRate: 89.2,
          avgDuration: '2.5 days'
        },
        {
          id: '2',
          name: 'Service Cancellation',
          status: 'active',
          steps: 3,
          completionRate: 95.8,
          avgDuration: '1 hour'
        },
        {
          id: '3',
          name: 'Payment Issue Resolution',
          status: 'draft',
          steps: 4,
          completionRate: 0,
          avgDuration: 'N/A'
        }
      ]
    }
  };

  useEffect(() => {
    loadAiData();
  }, []);

  const loadAiData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiData(mockAiData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleOptimize = async () => {
    try {
      await onScheduleOptimize?.(selectedOptimization);
    } catch (err) {
      console.error('Schedule optimization failed:', err);
    }
  };

  const handleMaintenancePredict = async () => {
    try {
      await onMaintenancePredict?.();
    } catch (err) {
      console.error('Maintenance prediction failed:', err);
    }
  };

  const handleBehaviorAnalyze = async () => {
    try {
      await onBehaviorAnalyze?.(selectedAnalysis);
    } catch (err) {
      console.error('Behavior analysis failed:', err);
    }
  };

  const handleAutoService = async (action) => {
    try {
      await onAutoService?.(action);
    } catch (err) {
      console.error('Automated service failed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      implemented: 'default',
      draft: 'outline'
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

  const renderSmartScheduling = () => (
    <div className="space-y-6">
      {/* Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{aiData.smartScheduling.currentEfficiency}%</div>
            <Progress value={aiData.smartScheduling.currentEfficiency} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Optimized Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aiData.smartScheduling.optimizedEfficiency}%</div>
            <Progress value={aiData.smartScheduling.optimizedEfficiency} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Potential Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              +{(aiData.smartScheduling.optimizedEfficiency - aiData.smartScheduling.currentEfficiency).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Efficiency gain</div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Improvements */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Improvements</CardTitle>
          <CardDescription>AI-driven scheduling optimizations and their impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.smartScheduling.improvements.map((improvement) => (
              <div key={improvement.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{improvement.description}</div>
                    <div className="text-sm text-gray-600">{improvement.impact}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{improvement.savings} hours/day</div>
                  {getStatusBadge(improvement.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Real-time scheduling recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.smartScheduling.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{recommendation.action}</div>
                  <div className="text-sm text-gray-600">{recommendation.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{recommendation.estimatedSavings} hours saved</div>
                  {getPriorityBadge(recommendation.priority)}
                  <Button size="sm" variant="outline" className="mt-2">
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPredictiveMaintenance = () => (
    <div className="space-y-6">
      {/* Equipment Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{aiData.predictiveMaintenance.equipmentHealth.overall}%</div>
            <Progress value={aiData.predictiveMaintenance.equipmentHealth.overall} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aiData.predictiveMaintenance.equipmentHealth.vehicles}%</div>
            <Progress value={aiData.predictiveMaintenance.equipmentHealth.vehicles} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{aiData.predictiveMaintenance.equipmentHealth.tools}%</div>
            <Progress value={aiData.predictiveMaintenance.equipmentHealth.tools} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Software</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{aiData.predictiveMaintenance.equipmentHealth.software}%</div>
            <Progress value={aiData.predictiveMaintenance.equipmentHealth.software} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
          <CardDescription>Upcoming maintenance tasks and predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.predictiveMaintenance.maintenanceSchedule.map((maintenance) => (
              <div key={maintenance.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{maintenance.equipment}</div>
                  <div className="text-sm text-gray-600">{maintenance.description}</div>
                  <div className="text-xs text-gray-500">
                    Due: {new Date(maintenance.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${maintenance.estimatedCost.toFixed(2)}</div>
                  {getPriorityBadge(maintenance.priority)}
                  <Badge variant="outline" className="ml-2">{maintenance.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Predictions</CardTitle>
          <CardDescription>Predictive maintenance alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.predictiveMaintenance.predictions.map((prediction) => (
              <div key={prediction.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center space-x-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">{prediction.equipment}</div>
                    <div className="text-sm text-gray-600">{prediction.issue}</div>
                    <div className="text-xs text-gray-500">
                      Estimated failure: {new Date(prediction.estimatedFailure).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{prediction.probability}% probability</div>
                  <div className="text-sm text-gray-600">{prediction.recommendedAction}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerBehavior = () => (
    <div className="space-y-6">
      {/* Behavior Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Behavior Patterns</CardTitle>
          <CardDescription>AI-identified patterns and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.customerBehavior.patterns.map((pattern) => (
              <div key={pattern.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{pattern.pattern}</div>
                  <div className="text-sm text-gray-600">{pattern.description}</div>
                  <div className="text-sm text-blue-600">{pattern.recommendation}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{pattern.confidence}% confidence</div>
                  <div className="text-sm text-green-600">{pattern.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
          <CardDescription>AI-powered customer segmentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.customerBehavior.segments.map((segment) => (
              <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{segment.name}</div>
                  <div className="text-sm text-gray-600">{segment.characteristics}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${segment.lifetimeValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{segment.count} customers</div>
                  <Badge variant={segment.churnRisk === 'High' ? 'destructive' : segment.churnRisk === 'Medium' ? 'secondary' : 'default'}>
                    {segment.churnRisk} Risk
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAutomatedService = () => (
    <div className="space-y-6">
      {/* Chatbot Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Customer Service</CardTitle>
          <CardDescription>AI chatbot performance and capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.automatedService.chatbots.map((bot) => (
              <div key={bot.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{bot.name}</div>
                  <div className="text-sm text-gray-600">
                    Topics: {bot.topics.join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{bot.resolutionRate}% resolution</div>
                  <div className="text-sm text-gray-600">{bot.avgResponseTime}s avg response</div>
                  <div className="text-sm text-blue-600">{bot.conversations} conversations</div>
                  {getStatusBadge(bot.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Responses</CardTitle>
          <CardDescription>AI-powered response templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.automatedService.autoResponses.map((response) => (
              <div key={response.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{response.trigger}</div>
                  <div className="text-sm text-gray-600">{response.response.substring(0, 80)}...</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{response.effectiveness}% effective</div>
                  <div className="text-sm text-gray-600">{response.usage} times used</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automated Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Workflows</CardTitle>
          <CardDescription>AI-driven process automation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiData.automatedService.workflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-sm text-gray-600">{workflow.steps} steps</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{workflow.completionRate}% completion</div>
                  <div className="text-sm text-gray-600">{workflow.avgDuration}</div>
                  {getStatusBadge(workflow.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading AI and automation features..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error loading AI features: {error}</div>
        <Button onClick={loadAiData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation & AI</h2>
          <p className="text-gray-600">Smart scheduling, predictive maintenance, and automated customer service</p>
        </div>
        <Button onClick={loadAiData} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduling">Smart Scheduling</TabsTrigger>
          <TabsTrigger value="maintenance">Predictive Maintenance</TabsTrigger>
          <TabsTrigger value="behavior">Customer Behavior</TabsTrigger>
          <TabsTrigger value="automation">Automated Service</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduling" className="space-y-6">
          {renderSmartScheduling()}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {renderPredictiveMaintenance()}
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          {renderCustomerBehavior()}
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          {renderAutomatedService()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationAI; 