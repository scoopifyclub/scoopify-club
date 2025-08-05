'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import JobsList from './components/JobsList';
import IntelligentJobMatcher from '@/components/IntelligentJobMatcher';
import RealTimeTracker from '@/components/RealTimeTracker';
import { Zap, MapPin, Clock, TrendingUp, Brain } from 'lucide-react';

export default function EmployeeJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ai-matching');
  const [userLocation, setUserLocation] = useState(null);
  const [currentService, setCurrentService] = useState(null);

  useEffect(() => {
    // Get user location for intelligent matching
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const handleServiceStart = (serviceId) => {
    setCurrentService(serviceId);
    toast.success('Service started! Live tracking enabled.');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-gray-600">AI-powered job matching and real-time tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Zap className="w-3 h-3 mr-1" />
            AI Enabled
          </Badge>
          <Badge variant="outline">
            <MapPin className="w-3 h-3 mr-1" />
            {userLocation ? 'Location Active' : 'Location Needed'}
          </Badge>
        </div>
      </div>

      {/* Current Service Tracking */}
      {currentService && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Active Service Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeTracker serviceId={currentService} />
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-matching" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Matching
          </TabsTrigger>
          <TabsTrigger value="available-jobs" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Available Jobs
          </TabsTrigger>
          <TabsTrigger value="my-schedule" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Intelligent Job Matching
              </CardTitle>
              <p className="text-sm text-gray-600">
                Our AI algorithm analyzes distance, pay, customer ratings, and your preferences to find the best jobs for you.
              </p>
            </CardHeader>
            <CardContent>
              <IntelligentJobMatcher 
                employeeId={user?.id} 
                userLocation={userLocation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available-jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Available Jobs</CardTitle>
              <p className="text-sm text-gray-600">
                Browse all available jobs in your service areas
              </p>
            </CardHeader>
            <CardContent>
              <JobsList user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <p className="text-sm text-gray-600">
                View your upcoming services and manage your schedule
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Services</h3>
                <p className="text-gray-600 mb-4">
                  Claim jobs from the AI Matching or Available Jobs tabs to see them here.
                </p>
                <Button 
                  onClick={() => setActiveTab('ai-matching')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Find Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jobs Completed</p>
                <p className="text-2xl font-bold">127</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">$3,420</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
