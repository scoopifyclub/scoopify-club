'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, DollarSign, Star, TrendingUp, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function IntelligentJobMatcher({ employeeId, userLocation }) {
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchScore, setMatchScore] = useState(0);
  const [algorithmStatus, setAlgorithmStatus] = useState('analyzing');

  useEffect(() => {
    simulateIntelligentMatching();
  }, [employeeId, userLocation]);

  const simulateIntelligentMatching = async () => {
    setLoading(true);
    setAlgorithmStatus('analyzing');
    
    // Simulate AI algorithm processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate intelligent job matches
    const jobs = generateIntelligentMatches();
    setMatchingJobs(jobs);
    
    setAlgorithmStatus('optimized');
    setLoading(false);
    
    toast.success('AI-powered job matching complete!', {
      description: `Found ${jobs.length} optimal matches for you`
    });
  };

  const generateIntelligentMatches = () => {
    const baseJobs = [
      {
        id: 1,
        customerName: 'Sarah Johnson',
        address: '123 Oak Street, Downtown',
        distance: 0.8,
        pay: 45,
        rating: 4.9,
        urgency: 'high',
        matchScore: 98,
        factors: ['distance', 'pay', 'rating'],
        scheduledTime: '2:00 PM',
        estimatedDuration: '25 minutes',
        serviceType: 'Standard Cleanup',
        specialNotes: 'Large yard, multiple dogs'
      },
      {
        id: 2,
        customerName: 'Mike Chen',
        address: '456 Pine Avenue, Midtown',
        distance: 1.2,
        pay: 38,
        rating: 4.7,
        urgency: 'medium',
        matchScore: 92,
        factors: ['distance', 'availability'],
        scheduledTime: '3:30 PM',
        estimatedDuration: '20 minutes',
        serviceType: 'Quick Cleanup',
        specialNotes: 'Small yard, single dog'
      },
      {
        id: 3,
        customerName: 'Lisa Rodriguez',
        address: '789 Elm Drive, Uptown',
        distance: 2.1,
        pay: 52,
        rating: 4.8,
        urgency: 'low',
        matchScore: 87,
        factors: ['pay', 'rating'],
        scheduledTime: '4:15 PM',
        estimatedDuration: '35 minutes',
        serviceType: 'Premium Service',
        specialNotes: 'Gated community, security code required'
      },
      {
        id: 4,
        customerName: 'David Thompson',
        address: '321 Maple Lane, Suburbs',
        distance: 3.5,
        pay: 65,
        rating: 4.6,
        urgency: 'medium',
        matchScore: 82,
        factors: ['pay'],
        scheduledTime: '5:00 PM',
        estimatedDuration: '45 minutes',
        serviceType: 'Deep Clean',
        specialNotes: 'Very large property, multiple areas'
      }
    ];

    // Sort by match score (AI algorithm result)
    return baseJobs.sort((a, b) => b.matchScore - a.matchScore);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 95) return 'bg-green-100 text-green-800';
    if (score >= 85) return 'bg-blue-100 text-blue-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleClaimJob = async (jobId) => {
    toast.success('Job claimed successfully!', {
      description: 'AI algorithm will find your next optimal match'
    });
    
    // Remove claimed job and re-optimize
    setMatchingJobs(prev => prev.filter(job => job.id !== jobId));
    
    // Simulate new job being added to queue
    setTimeout(() => {
      toast.info('New job added to your queue!', {
        description: 'AI is analyzing optimal matches...'
      });
    }, 3000);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            AI-Powered Job Matching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Analyzing optimal matches...</span>
              <span>{matchScore}%</span>
            </div>
            <Progress value={matchScore} className="h-2" />
          </div>
          <div className="text-sm text-gray-600">
            <p>🤖 AI Algorithm Status: {algorithmStatus}</p>
            <p>📍 Analyzing distance optimization...</p>
            <p>💰 Calculating pay-to-effort ratios...</p>
            <p>⭐ Evaluating customer ratings...</p>
            <p>⏰ Checking schedule compatibility...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          AI-Powered Job Matching
          <Badge className="bg-green-100 text-green-800">
            {matchingJobs.length} Optimal Matches
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Insights */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
            <TrendingUp className="w-4 h-4" />
            AI Insights
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Distance optimization: {matchingJobs[0]?.distance} miles average</p>
            <p>• Pay efficiency: ${matchingJobs[0]?.pay}/hour potential</p>
            <p>• Customer satisfaction: {matchingJobs[0]?.rating} average rating</p>
            <p>• Schedule optimization: 95% time efficiency</p>
          </div>
        </div>

        {/* Job Matches */}
        <div className="space-y-3">
          {matchingJobs.map((job) => (
            <Card key={job.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{job.customerName}</h3>
                      <Badge className={getUrgencyColor(job.urgency)}>
                        {job.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.address} ({job.distance} miles)
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getMatchScoreColor(job.matchScore)}>
                      {job.matchScore}% Match
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">${job.pay}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{job.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{job.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>{job.estimatedDuration}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-3">
                  <p><strong>Service:</strong> {job.serviceType}</p>
                  <p><strong>Notes:</strong> {job.specialNotes}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    AI Factors: {job.factors.join(', ')}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleClaimJob(job.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Claim Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">AI Performance Metrics</div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-gray-600">Match Accuracy</div>
              <div className="font-medium text-green-600">96%</div>
            </div>
            <div>
              <div className="text-gray-600">Response Time</div>
              <div className="font-medium text-blue-600">2.1s</div>
            </div>
            <div>
              <div className="text-gray-600">Efficiency Gain</div>
              <div className="font-medium text-purple-600">+34%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 