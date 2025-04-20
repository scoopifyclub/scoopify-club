'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, CheckCircle, AlertTriangle, Clock, Printer, Search, Filter, ChevronDown, ArrowUpDown, Check, X, Edit, Timer, TimerOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { format, isToday, isYesterday, isTomorrow, differenceInMinutes } from 'date-fns';

interface ServiceType {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'DELAYED';
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  serviceType: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  price: number;
  notes?: string;
  petDetails?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [timeExtension, setTimeExtension] = useState('');
  const [showTimeExtensionDialog, setShowTimeExtensionDialog] = useState(false);
  const [showServiceDetailDialog, setShowServiceDetailDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [serviceNote, setServiceNote] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const { toast } = useToast();

  // Fetch services data
  useEffect(() => {
    const fetchServicesData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // In a real app, fetch from API
          setTimeout(() => {
            const mockServices: ServiceType[] = [];
            
            // Create mock services
            for (let i = 0; i < 15; i++) {
              const today = new Date();
              let date;
              
              // Distribute services - some past, mostly upcoming
              if (i < 3) {
                // Past services
                date = new Date(today);
                date.setDate(today.getDate() - (i + 1));
              } else if (i < 7) {
                // Today's services
                date = new Date(today);
              } else {
                // Future services
                date = new Date(today);
                date.setDate(today.getDate() + (i - 6));
              }
              
              mockServices.push({
                id: `service-${i}`,
                status: i < 3 ? 'COMPLETED' :
                         i === 7 ? 'IN_PROGRESS' :
                         i === 8 ? 'DELAYED' :
                         i === 9 ? 'CANCELED' : 'SCHEDULED',
                customerName: `Customer ${i + 1}`,
                customerAddress: `${100 + i} Main St, Anytown, USA`,
                customerPhone: `(555) 555-${1000 + i}`,
                serviceType: i % 3 === 0 ? 'Weekly Cleanup' : 
                            i % 3 === 1 ? 'Bi-Weekly Cleanup' : 'One-Time Cleanup',
                scheduledDate: date,
                scheduledTime: `${9 + (i % 8)}:00 ${(i % 8) < 3 ? 'AM' : 'PM'}`,
                duration: 15 + (i % 3) * 5, // 15, 20, or 25 minutes
                price: 15 + (i % 3) * 5, // $15, $20, or $25
                notes: i % 2 === 0 ? 'Customer has 2 large dogs. Gate code 1234. Waste bins on side of house.' : undefined,
                petDetails: i % 2 === 0 ? '2 German Shepherds, 1 Labrador' : '1 Bulldog, 1 Poodle'
              });
            }
            
            setServices(mockServices);
            setFilteredServices(mockServices);
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          console.error('Error fetching services:', error);
          setIsLoading(false);
        }
      }
    };
    
    fetchServicesData();
  }, [session, status]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...services];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => service.status === statusFilter);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.customerName.toLowerCase().includes(query) ||
        service.customerAddress.toLowerCase().includes(query) ||
        service.serviceType.toLowerCase().includes(query)
      );
    }
    
    setFilteredServices(filtered);
  }, [services, statusFilter, searchQuery]);

  // Timer functionality
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const startTimer = () => {
    setIsTimerActive(true);
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === 59) {
          setTimerMinutes(prevMin => prevMin + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    setTimerInterval(interval);
    
    // Update service status to IN_PROGRESS
    if (selectedService) {
      const updatedServices = services.map(s => {
        if (s.id === selectedService.id) {
          return { ...s, status: 'IN_PROGRESS' as const };
        }
        return s;
      });
      setServices(updatedServices);
      setSelectedService({ ...selectedService, status: 'IN_PROGRESS' });
      
      toast({
        title: "Service started",
        description: "Timer has been started for this service.",
      });
    }
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerActive(false);
  };

  const resetTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerActive(false);
    setTimerMinutes(0);
    setTimerSeconds(0);
  };

  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleRequestExtension = () => {
    setShowTimeExtensionDialog(true);
  };

  const submitTimeExtension = () => {
    toast({
      title: "Extension requested",
      description: `You have requested a ${timeExtension} minute extension.`,
    });
    setShowTimeExtensionDialog(false);
    setTimeExtension('');
  };

  const markServiceComplete = () => {
    // Stop the timer if running
    pauseTimer();
    
    if (selectedService) {
      const updatedServices = services.map(s => {
        if (s.id === selectedService.id) {
          return { ...s, status: 'COMPLETED' as const };
        }
        return s;
      });
      setServices(updatedServices);
      setSelectedService({ ...selectedService, status: 'COMPLETED' });
      
      toast({
        title: "Service completed",
        description: "This service has been marked as completed.",
      });
      
      // Close the detail dialog
      setShowServiceDetailDialog(false);
    }
  };

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setServiceNote('');
    resetTimer();
    
    // Generate default checklist based on service type
    let defaultChecklist: ChecklistItem[] = [];
    
    if (service.serviceType === 'Weekly Cleanup') {
      defaultChecklist = [
        { id: '1', title: 'Check entire yard for waste', completed: false },
        { id: '2', title: 'Empty and replace waste station bags if needed', completed: false },
        { id: '3', title: 'Document any yard hazards', completed: false },
        { id: '4', title: 'Ensure gate is secure when leaving', completed: false },
        { id: '5', title: 'Apply yard deodorizer as requested', completed: false },
      ];
    } else if (service.serviceType === 'Bi-Weekly Cleanup') {
      defaultChecklist = [
        { id: '1', title: 'Thorough inspection of entire property', completed: false },
        { id: '2', title: 'Remove all pet waste from yard', completed: false },
        { id: '3', title: 'Check fence perimeter for access issues', completed: false },
        { id: '4', title: 'Empty and replace waste station bags', completed: false },
        { id: '5', title: 'Apply yard deodorizer as requested', completed: false },
        { id: '6', title: 'Report any yard issues to customer', completed: false },
      ];
    } else {
      defaultChecklist = [
        { id: '1', title: 'Initial yard assessment', completed: false },
        { id: '2', title: 'Complete waste removal', completed: false },
        { id: '3', title: 'Document yard condition', completed: false },
        { id: '4', title: 'Take before/after photos', completed: false },
        { id: '5', title: 'Discuss service options with customer if present', completed: false },
      ];
    }
    
    setChecklist(defaultChecklist);
    setShowServiceDetailDialog(true);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleChecklistComplete = () => {
    toast({
      title: "Checklist saved",
      description: `Completed ${checklist.filter(i => i.completed).length} of ${checklist.length} items.`,
    });
    setShowChecklistDialog(false);
  };

  const formatServiceDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'DELAYED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'DELAYED':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'CANCELED':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Services</h1>
          <p className="text-gray-500">
            Manage and track all your assigned waste removal services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Schedule
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input 
            placeholder="Search services, customers, addresses..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DELAYED">Delayed</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All Services</TabsTrigger>
        </TabsList>
        
        {['upcoming', 'today', 'past', 'all'].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4 pt-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No services found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredServices
                  .filter(service => {
                    const serviceDate = new Date(service.scheduledDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (tabValue === 'upcoming') {
                      return serviceDate >= today && service.status !== 'COMPLETED' && service.status !== 'CANCELED';
                    } else if (tabValue === 'today') {
                      return isToday(serviceDate);
                    } else if (tabValue === 'past') {
                      return serviceDate < today || service.status === 'COMPLETED';
                    }
                    return true; // 'all' tab
                  })
                  .map(service => (
                    <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-medium">{service.customerName}</CardTitle>
                            <Badge 
                              variant="outline" 
                              className={getStatusBadgeColor(service.status)}
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(service.status)}
                                {service.status}
                              </span>
                            </Badge>
                          </div>
                          <CardDescription>{service.serviceType}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatServiceDate(service.scheduledDate)}</div>
                          <div className="text-sm text-gray-500">{service.scheduledTime}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm text-gray-600 mt-1">{service.customerAddress}</div>
                        
                        <div className="flex justify-between items-center mt-3 text-sm">
                          <div className="flex gap-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-500 mr-1" />
                              <span>{service.duration} mins</span>
                            </div>
                            <div className="text-green-600 font-medium">${service.price}</div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleServiceSelect(service)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Service Detail Dialog */}
      <Dialog open={showServiceDetailDialog} onOpenChange={setShowServiceDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedService.customerName}</DialogTitle>
                  <Badge variant="outline" className={getStatusBadgeColor(selectedService.status)}>
                    {selectedService.status}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedService.serviceType} - {formatServiceDate(selectedService.scheduledDate)} at {selectedService.scheduledTime}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Customer Info</h3>
                    <p className="mt-1">{selectedService.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedService.customerPhone}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedService.customerAddress}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Service Details</h3>
                    <p className="mt-1">{selectedService.serviceType}</p>
                    <p className="text-sm text-gray-600">Duration: {selectedService.duration} mins</p>
                    <p className="text-sm font-medium text-green-600 mt-1">Price: ${selectedService.price}</p>
                    
                    {selectedService.petDetails && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-500">Pet Details</h3>
                        <p className="text-sm text-gray-600">{selectedService.petDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedService.notes && (
                  <div className="border-t pt-4 mt-2">
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="text-sm text-gray-600 mt-1 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                      {selectedService.notes}
                    </p>
                  </div>
                )}
                
                {/* Service Controls */}
                <div className="border-t pt-4 mt-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Service Actions</h3>
                  
                  {/* Timer Section */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <div className="text-2xl font-mono font-bold">{formatTime(timerMinutes, timerSeconds)}</div>
                      <span className="text-sm text-gray-500 ml-2">/ {selectedService.duration} mins</span>
                    </div>
                    <div className="flex gap-2">
                      {!isTimerActive ? (
                        <Button 
                          size="sm" 
                          onClick={startTimer}
                          disabled={selectedService.status === 'COMPLETED' || selectedService.status === 'CANCELED'}
                        >
                          <Timer className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={pauseTimer}>
                          <TimerOff className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleRequestExtension}
                        disabled={!isTimerActive || selectedService.status === 'COMPLETED' || selectedService.status === 'CANCELED'}
                      >
                        Request Extension
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowChecklistDialog(true)}
                      disabled={selectedService.status === 'COMPLETED' || selectedService.status === 'CANCELED'}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Service Checklist
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={selectedService.status === 'COMPLETED' || selectedService.status === 'CANCELED'}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photos
                    </Button>
                    
                    <Textarea 
                      placeholder="Add notes about this service..."
                      className="col-span-2 h-20 mt-2"
                      value={serviceNote}
                      onChange={(e) => setServiceNote(e.target.value)}
                      disabled={selectedService.status === 'COMPLETED' || selectedService.status === 'CANCELED'}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowServiceDetailDialog(false)}>Cancel</Button>
                <Button 
                  onClick={markServiceComplete}
                  disabled={selectedService.status === 'COMPLETED' || selectedService.status === 'CANCELED'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Time Extension Dialog */}
      <Dialog open={showTimeExtensionDialog} onOpenChange={setShowTimeExtensionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Time Extension</DialogTitle>
            <DialogDescription>
              Request additional time if you need longer than the allocated service duration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Minutes Needed</label>
              <Select value={timeExtension} onValueChange={setTimeExtension}>
                <SelectTrigger>
                  <SelectValue placeholder="Select minutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason for Extension</label>
              <Textarea className="mt-1" placeholder="Explain why you need more time..." />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeExtensionDialog(false)}>Cancel</Button>
            <Button onClick={submitTimeExtension} disabled={!timeExtension}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Service Checklist</DialogTitle>
            <DialogDescription>
              Complete all required tasks for this service.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] mt-2">
            <div className="space-y-4">
              {checklist.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox 
                    id={`checklist-${item.id}`} 
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                  />
                  <label 
                    htmlFor={`checklist-${item.id}`} 
                    className={`text-sm cursor-pointer ${item.completed ? 'line-through text-gray-500' : ''}`}
                  >
                    {item.title}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm">Progress:</span>
              <span className="text-sm font-medium">
                {Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(checklist.filter(i => i.completed).length / checklist.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChecklistDialog(false)}>Cancel</Button>
            <Button onClick={handleChecklistComplete}>Save Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 