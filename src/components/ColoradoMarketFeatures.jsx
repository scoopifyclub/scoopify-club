'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Mountain, Users, Star, DollarSign, Calendar, Award, Shield, TreePine, Map } from 'lucide-react';
import { toast } from 'sonner';

export default function ColoradoMarketFeatures() {
  const [marketData, setMarketData] = useState({
    denver: {
      customers: 127,
      employees: 8,
      revenue: 6350,
      satisfaction: 4.8,
      growth: 23.5
    },
    coloradoSprings: {
      customers: 89,
      employees: 6,
      revenue: 4450,
      satisfaction: 4.9,
      growth: 31.2
    },
    saltLakeCity: {
      customers: 67,
      employees: 4,
      revenue: 3350,
      satisfaction: 4.7,
      growth: 18.9
    }
  });

  const [militaryCustomers, setMilitaryCustomers] = useState(34);
  const [outdoorPartnerships, setOutdoorPartnerships] = useState(12);

  useEffect(() => {
    // Simulate real-time market updates
    const interval = setInterval(() => {
      setMarketData(prev => ({
        denver: {
          ...prev.denver,
          customers: prev.denver.customers + Math.floor(Math.random() * 2),
          revenue: prev.denver.revenue + Math.floor(Math.random() * 50)
        },
        coloradoSprings: {
          ...prev.coloradoSprings,
          customers: prev.coloradoSprings.customers + Math.floor(Math.random() * 2),
          revenue: prev.coloradoSprings.revenue + Math.floor(Math.random() * 40)
        },
        saltLakeCity: {
          ...prev.saltLakeCity,
          customers: prev.saltLakeCity.customers + Math.floor(Math.random() * 2),
          revenue: prev.saltLakeCity.revenue + Math.floor(Math.random() * 30)
        }
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleMilitaryDiscount = () => {
    toast.success('Military discount applied!', {
      description: 'Thank you for your service - 15% off your first month'
    });
  };

  const handleOutdoorPartnership = () => {
    toast.success('Outdoor partnership activated!', {
      description: 'Get 10% off at local outdoor gear stores'
    });
  };

  return (
    <div className="space-y-6">
      {/* Colorado Market Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-blue-500" />
            Rocky Mountain Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800">Denver</h3>
              <p className="text-2xl font-bold">{marketData.denver.customers}</p>
              <p className="text-sm text-gray-600">Customers</p>
              <Badge className="bg-green-100 text-green-800 mt-2">
                +{marketData.denver.growth}% Growth
              </Badge>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-bold text-green-800">Colorado Springs</h3>
              <p className="text-2xl font-bold">{marketData.coloradoSprings.customers}</p>
              <p className="text-sm text-gray-600">Customers</p>
              <Badge className="bg-green-100 text-green-800 mt-2">
                +{marketData.coloradoSprings.growth}% Growth
              </Badge>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-bold text-purple-800">Salt Lake City</h3>
              <p className="text-2xl font-bold">{marketData.saltLakeCity.customers}</p>
              <p className="text-sm text-gray-600">Customers</p>
              <Badge className="bg-green-100 text-green-800 mt-2">
                +{marketData.saltLakeCity.growth}% Growth
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Military Community Features */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Military Community Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active Military Customers</p>
              <p className="text-2xl font-bold text-green-600">{militaryCustomers}</p>
            </div>
            <Button onClick={handleMilitaryDiscount} className="bg-green-600 hover:bg-green-700">
              <Shield className="w-4 h-4 mr-2" />
              Apply Military Discount
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Peterson AFB</p>
              <p className="text-green-600">12 active customers</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Fort Carson</p>
              <p className="text-green-600">8 active customers</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Buckley SFB</p>
              <p className="text-green-600">6 active customers</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Other Bases</p>
              <p className="text-green-600">8 active customers</p>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Military Benefits</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 15% discount for active duty and veterans</li>
              <li>• Flexible scheduling for deployment families</li>
              <li>• Priority service during PCS moves</li>
              <li>• Special rates for military housing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Outdoor Community Partnerships */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-orange-500" />
            Outdoor Community Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active Partnerships</p>
              <p className="text-2xl font-bold text-orange-600">{outdoorPartnerships}</p>
            </div>
            <Button onClick={handleOutdoorPartnership} className="bg-orange-600 hover:bg-orange-700">
              <TreePine className="w-4 h-4 mr-2" />
              Join Partnership
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-orange-800">Denver Partners</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">REI Denver</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Washington Park Dog Park</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Cherry Creek State Park</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-orange-800">Colorado Springs Partners</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Garden of the Gods</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Bear Creek Dog Park</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Pikes Peak Region</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Partnership Benefits</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• 10% off at partner outdoor gear stores</li>
              <li>• Free dog waste bags at partner locations</li>
              <li>• Priority booking for hiking group members</li>
              <li>• Special rates for outdoor event attendees</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Local Market Insights */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-purple-500" />
            Local Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-3">Top Performing Neighborhoods</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Wash Park, Denver</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">45 customers</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">4.9</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Broadmoor, CO Springs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">32 customers</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">4.8</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Sugar House, SLC</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">28 customers</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">4.7</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-purple-800 mb-3">Revenue by City</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Denver</span>
                    <span>${marketData.denver.revenue.toLocaleString()}</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Colorado Springs</span>
                    <span>${marketData.coloradoSprings.revenue.toLocaleString()}</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Salt Lake City</span>
                    <span>${marketData.saltLakeCity.revenue.toLocaleString()}</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Market Opportunities</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• High demand in affluent neighborhoods (Wash Park, Broadmoor)</li>
              <li>• Strong military community in Colorado Springs</li>
              <li>• Growing outdoor culture in Salt Lake City</li>
              <li>• Seasonal demand peaks during summer months</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 