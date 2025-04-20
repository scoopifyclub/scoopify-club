'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Navigation, Car, Clock, RotateCw, Search, ChevronDown, List, MapIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

// Mock data for locations
interface ServiceLocation {
  id: string;
  customerName: string;
  address: string;
  city: string;
  scheduledTime: string;
  completed: boolean;
  lat: number;
  lng: number;
  yardSize: 'Small' | 'Medium' | 'Large';
  dogs: number;
  gateCode?: string;
  specialInstructions?: string;
}

export default function MapsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [transportMode, setTransportMode] = useState('driving');
  const [mapObject, setMapObject] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState('');
  const { toast } = useToast();

  // Load Google Maps API
  useEffect(() => {
    // In a real application, you would load the actual Google Maps API
    // For this demo, we'll simulate it
    setTimeout(() => {
      setMapLoaded(true);
      
      // Mock locations
      const mockLocations: ServiceLocation[] = [
        {
          id: '1',
          customerName: 'John Smith',
          address: '123 Main St',
          city: 'Anytown, CA',
          scheduledTime: '9:00 AM',
          completed: false,
          lat: 34.052235,
          lng: -118.243683,
          yardSize: 'Medium',
          dogs: 2,
          gateCode: '1234',
          specialInstructions: 'Dogs may be in backyard. Please text before arrival.'
        },
        {
          id: '2',
          customerName: 'Sarah Johnson',
          address: '456 Oak Ave',
          city: 'Anytown, CA',
          scheduledTime: '10:30 AM',
          completed: false,
          lat: 34.059483,
          lng: -118.278621,
          yardSize: 'Large',
          dogs: 3,
          specialInstructions: 'Waste bins on side of garage. Beware of sprinklers.'
        },
        {
          id: '3',
          customerName: 'Michael Brown',
          address: '789 Pine Rd',
          city: 'Anytown, CA',
          scheduledTime: '1:00 PM',
          completed: false,
          lat: 34.073678,
          lng: -118.240082,
          yardSize: 'Small',
          dogs: 1,
          gateCode: '5678'
        },
        {
          id: '4',
          customerName: 'Emma Davis',
          address: '101 Cedar Blvd',
          city: 'Anytown, CA',
          scheduledTime: '2:30 PM',
          completed: false,
          lat: 34.061867,
          lng: -118.300125,
          yardSize: 'Medium',
          dogs: 2
        },
        {
          id: '5',
          customerName: 'Robert Wilson',
          address: '202 Maple Dr',
          city: 'Anytown, CA',
          scheduledTime: '4:00 PM',
          completed: false,
          lat: 34.045803,
          lng: -118.269012,
          yardSize: 'Small',
          dogs: 1,
          specialInstructions: 'Enter through side gate. Waste bags provided.'
        }
      ];
      
      setLocations(mockLocations);
      
      // Initialize mock map
      if (mapRef.current) {
        // In a real app, this would be where we initialize the Google Map
        const mockMap = {
          setCenter: () => {},
          setZoom: () => {},
        };
        setMapObject(mockMap);
        
        // Set up mock directions renderer
        setDirectionsRenderer({
          setMap: () => {},
          setDirections: () => {},
        });
      }
    }, 1000);
  }, []);

  // Filter locations based on search
  const filteredLocations = locations.filter(location => 
    location.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle location selection
  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
    
    // Clear optimized route when selection changes
    setRouteOptimized(false);
  };

  // Select all locations
  const selectAllLocations = () => {
    if (selectedLocations.length === filteredLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(filteredLocations.map(location => location.id));
    }
    setRouteOptimized(false);
  };

  // Optimize route
  const optimizeRoute = () => {
    if (selectedLocations.length < 2) {
      toast({
        title: "Route Optimization Error",
        description: "Please select at least 2 locations to optimize a route.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would calculate the optimal route using Google's Direction Service
    // For this demo, we'll just simulate it
    
    // Simulate processing time
    setTimeout(() => {
      // Sort selected locations by ID for this demo (in real app, would be optimal order)
      const sortedLocations = [...selectedLocations].sort();
      setSelectedLocations(sortedLocations);
      setRouteOptimized(true);
      
      // Set mock estimated time and distance
      setEstimatedTime('1 hour 45 minutes');
      setEstimatedDistance('28.5 miles');
      
      toast({
        title: "Route Optimized",
        description: "The most efficient route has been calculated.",
      });
    }, 1500);
  };

  // Navigate to location
  const navigateToLocation = (locationId: string) => {
    // In a real app, this would open navigation in Google Maps or similar
    // For this demo, we'll just show a notification
    
    const location = locations.find(loc => loc.id === locationId);
    
    if (location) {
      toast({
        title: "Starting Navigation",
        description: `Navigating to: ${location.address}, ${location.city}`,
      });
      
      // In a real app, we would use something like:
      // window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`);
    }
  };

  // Mark location as completed
  const markLocationCompleted = (locationId: string, completed: boolean) => {
    setLocations(prev => 
      prev.map(location => 
        location.id === locationId ? { ...location, completed } : location
      )
    );
  };

  // Render locations list
  const renderLocationsList = () => {
    return (
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-2 p-1">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No locations found
            </div>
          ) : (
            filteredLocations.map(location => (
              <Card key={location.id} className={`${location.completed ? 'bg-gray-50' : ''}`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <Checkbox 
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => toggleLocation(location.id)}
                        id={`location-${location.id}`}
                      />
                      <div>
                        <CardTitle className="text-base font-medium">
                          {location.customerName}
                        </CardTitle>
                        <CardDescription>
                          {location.scheduledTime} • {location.completed ? 'Completed' : 'Pending'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm">{location.address}, {location.city}</p>
                  
                  <div className="mt-2 text-xs text-gray-500 flex gap-2">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                      {location.yardSize} Yard
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                      {location.dogs} {location.dogs === 1 ? 'Dog' : 'Dogs'}
                    </span>
                    {location.gateCode && (
                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded-full">
                        Gate: {location.gateCode}
                      </span>
                    )}
                  </div>
                  
                  {location.specialInstructions && (
                    <p className="mt-2 text-xs italic text-gray-600">
                      Note: {location.specialInstructions}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToLocation(location.id)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  <Button
                    variant={location.completed ? "outline" : "default"}
                    size="sm"
                    onClick={() => markLocationCompleted(location.id, !location.completed)}
                  >
                    {location.completed ? 'Undo Complete' : 'Mark Complete'}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Routes & Yards</h1>
        <p className="text-gray-500">
          Plan your route and navigate to customer yards for waste cleanup
        </p>
      </div>
      
      <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="map">
              <MapIcon className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={transportMode} onValueChange={setTransportMode}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Transport Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driving">
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Driving
                  </div>
                </SelectItem>
                <SelectItem value="bicycling">Bicycling</SelectItem>
                <SelectItem value="walking">Walking</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="default"
              onClick={optimizeRoute}
              disabled={selectedLocations.length < 2}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Optimize Route
            </Button>
          </div>
        </div>
        
        <div className="flex mt-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input 
              placeholder="Search customers or addresses..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="ml-2"
            onClick={selectAllLocations}
          >
            {selectedLocations.length === filteredLocations.length && filteredLocations.length > 0 
              ? 'Deselect All' 
              : 'Select All'}
          </Button>
        </div>
        
        <TabsContent value="map" className="mt-0">
          <div className="grid grid-cols-3 gap-4 h-[calc(100vh-280px)]">
            <Card className="col-span-2">
              <CardContent className="p-4">
                {mapLoaded ? (
                  <div 
                    ref={mapRef} 
                    className="w-full h-full rounded-md bg-gray-100 flex items-center justify-center"
                    style={{ minHeight: '500px' }}
                  >
                    <div className="text-center p-4">
                      <MapIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-muted-foreground">
                        Map integration would appear here with Google Maps API
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        (In a production environment with proper API keys)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '500px' }}>
                    <p>Loading map...</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Route Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLocations.length < 2 ? (
                    <p className="text-sm text-muted-foreground">
                      Select at least 2 locations to plan a route
                    </p>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stops:</span>
                            <span className="font-medium">{selectedLocations.length}</span>
                          </div>
                          
                          {routeOptimized && (
                            <>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Estimated Time:</span>
                                <span className="font-medium">{estimatedTime}</span>
                              </div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Total Distance:</span>
                                <span className="font-medium">{estimatedDistance}</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Selected Stops:</p>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {selectedLocations.map((locId, index) => {
                              const location = locations.find(l => l.id === locId);
                              if (!location) return null;
                              
                              return (
                                <div key={locId} className="flex items-start gap-2 border-b pb-2">
                                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{location.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{location.address}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    disabled={!routeOptimized || selectedLocations.length < 1}
                    onClick={() => navigateToLocation(selectedLocations[0])}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Start Navigation
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Route Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Avoid Tolls</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Checkbox id="avoid-tolls" />
                        <label htmlFor="avoid-tolls" className="text-sm">
                          Plan route avoiding toll roads
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Avoid Highways</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Checkbox id="avoid-highways" />
                        <label htmlFor="avoid-highways" className="text-sm">
                          Plan route avoiding highways
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Traffic Conditions</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Checkbox id="traffic-conditions" checked />
                        <label htmlFor="traffic-conditions" className="text-sm">
                          Consider real-time traffic
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Departure Time</label>
                      <Select defaultValue="now">
                        <SelectTrigger>
                          <SelectValue placeholder="Departure time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="now">Leave now</SelectItem>
                          <SelectItem value="15min">In 15 minutes</SelectItem>
                          <SelectItem value="30min">In 30 minutes</SelectItem>
                          <SelectItem value="1hour">In 1 hour</SelectItem>
                          <SelectItem value="custom">Custom time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          {renderLocationsList()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 