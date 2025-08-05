// Enhanced Customer Portal Component
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  Star, 
  Camera, 
  Share2, 
  Download, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown,
  Gift,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner, LoadingOverlay, ListLoading } from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';

const CustomerPortal = ({ 
  customerId,
  className,
  ...props 
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await Promise.all([
        loadServices(),
        loadPhotos(),
        loadReviews(),
        loadReferrals()
      ]);
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    // Mock service history
    const mockServices = [
      {
        id: 1,
        date: '2024-01-15',
        time: '10:30 AM',
        type: 'Premium Service',
        status: 'completed',
        employee: 'John Smith',
        rating: 5,
        photos: 3,
        notes: 'Great service as always!'
      },
      {
        id: 2,
        date: '2024-01-08',
        time: '2:15 PM',
        type: 'Basic Cleanup',
        status: 'completed',
        employee: 'Sarah Johnson',
        rating: 4,
        photos: 2,
        notes: 'Yard looks great'
      },
      {
        id: 3,
        date: '2024-01-22',
        time: '9:00 AM',
        type: 'Premium Service',
        status: 'scheduled',
        employee: 'Mike Wilson',
        rating: null,
        photos: 0,
        notes: null
      }
    ];
    setServices(mockServices);
  };

  const loadPhotos = async () => {
    // Mock photos
    const mockPhotos = [
      {
        id: 1,
        serviceId: 1,
        url: '/images/backyard1.jpg',
        date: '2024-01-15',
        description: 'After cleanup - backyard'
      },
      {
        id: 2,
        serviceId: 1,
        url: '/images/backyard2.jpg',
        date: '2024-01-15',
        description: 'After cleanup - side yard'
      },
      {
        id: 3,
        serviceId: 2,
        url: '/images/dogs-backyard.jpg',
        date: '2024-01-08',
        description: 'Happy dogs in clean yard'
      }
    ];
    setPhotos(mockPhotos);
  };

  const loadReviews = async () => {
    // Mock reviews
    const mockReviews = [
      {
        id: 1,
        serviceId: 1,
        rating: 5,
        comment: 'Excellent service! The team was professional and thorough.',
        date: '2024-01-15',
        helpful: 2
      },
      {
        id: 2,
        serviceId: 2,
        rating: 4,
        comment: 'Good service, yard looks much better.',
        date: '2024-01-08',
        helpful: 1
      }
    ];
    setReviews(mockReviews);
  };

  const loadReferrals = async () => {
    // Mock referrals
    const mockReferrals = [
      {
        id: 1,
        friendName: 'Jane Doe',
        friendEmail: 'jane@example.com',
        status: 'pending',
        date: '2024-01-10',
        reward: '$10 credit'
      },
      {
        id: 2,
        friendName: 'Bob Wilson',
        friendEmail: 'bob@example.com',
        status: 'completed',
        date: '2024-01-05',
        reward: '$10 credit'
      }
    ];
    setReferrals(mockReferrals);
  };

  const handlePhotoUpload = async (file) => {
    setUploadingPhoto(true);
    try {
      // Simulate photo upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPhoto = {
        id: photos.length + 1,
        serviceId: selectedService?.id,
        url: URL.createObjectURL(file),
        date: new Date().toISOString().split('T')[0],
        description: file.name
      };
      
      setPhotos(prev => [newPhoto, ...prev]);
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setSubmittingReview(true);
    try {
      // Simulate review submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newReview = {
        id: reviews.length + 1,
        serviceId: selectedService?.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toISOString().split('T')[0],
        helpful: 0
      };
      
      setReviews(prev => [newReview, ...prev]);
      setShowReviewModal(false);
    } catch (error) {
      console.error('Review submission failed:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReferralSubmit = async (referralData) => {
    try {
      // Simulate referral submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReferral = {
        id: referrals.length + 1,
        friendName: referralData.name,
        friendEmail: referralData.email,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        reward: '$10 credit'
      };
      
      setReferrals(prev => [newReferral, ...prev]);
    } catch (error) {
      console.error('Referral submission failed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800';
      case 'scheduled': return 'bg-primary-100 text-primary-800';
      case 'pending': return 'bg-warning-100 text-warning-800';
      case 'cancelled': return 'bg-error-100 text-error-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const renderServiceHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Service History</h3>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export History
        </Button>
      </div>
      
      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-lg">{service.type}</h4>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{service.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{service.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{service.employee}</span>
                    </div>
                  </div>
                  
                  {service.notes && (
                    <p className="text-sm text-neutral-600 mt-2">{service.notes}</p>
                  )}
                  
                  {service.rating && (
                    <div className="flex items-center space-x-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < service.rating ? "text-yellow-400 fill-current" : "text-neutral-300"
                          )}
                        />
                      ))}
                      <span className="text-sm text-neutral-600 ml-1">
                        ({service.rating}/5)
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  {service.photos > 0 && (
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      {service.photos} Photos
                    </Button>
                  )}
                  
                  {service.status === 'completed' && !service.rating && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        setShowReviewModal(true);
                      }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate Service
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPhotoGallery = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Photo Gallery</h3>
        <Button 
          onClick={() => setShowPhotoUpload(true)}
          disabled={!selectedService}
        >
          <Camera className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative">
              <img
                src={photo.url}
                alt={photo.description}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                <div className="opacity-0 hover:opacity-100 transition-opacity flex space-x-2">
                  <Button size="sm" variant="secondary">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm font-medium">{photo.description}</p>
              <p className="text-xs text-neutral-500">{photo.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Reviews</h3>
        <Button 
          onClick={() => setShowReviewModal(true)}
          disabled={!selectedService}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Write Review
        </Button>
      </div>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating ? "text-yellow-400 fill-current" : "text-neutral-300"
                        )}
                      />
                    ))}
                    <span className="text-sm text-neutral-600">({review.rating}/5)</span>
                  </div>
                  
                  <p className="text-neutral-700 mb-2">{review.comment}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
                    <span>{review.date}</span>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpful} helpful</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReferrals = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Referral Program</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Gift className="w-4 h-4 mr-2" />
              Refer a Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refer a Friend</DialogTitle>
              <DialogDescription>
                Share Scoopify Club with your friends and earn rewards!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="friendName">Friend's Name</Label>
                <Input id="friendName" placeholder="Enter friend's name" />
              </div>
              <div>
                <Label htmlFor="friendEmail">Friend's Email</Label>
                <Input id="friendEmail" type="email" placeholder="Enter friend's email" />
              </div>
              <Button className="w-full" onClick={() => handleReferralSubmit({
                name: 'Friend Name',
                email: 'friend@example.com'
              })}>
                Send Referral
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-6 h-6 text-primary-600" />
          <h4 className="font-semibold">How it works</h4>
        </div>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>• Refer friends to Scoopify Club</li>
          <li>• They get 20% off their first service</li>
          <li>• You get $10 credit when they sign up</li>
          <li>• Unlimited referrals!</li>
        </ul>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-semibold">Your Referrals</h4>
        {referrals.map((referral) => (
          <Card key={referral.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{referral.friendName}</p>
                  <p className="text-sm text-neutral-600">{referral.friendEmail}</p>
                  <p className="text-xs text-neutral-500">{referral.date}</p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(referral.status)}>
                    {referral.status}
                  </Badge>
                  <p className="text-sm font-medium text-primary-600 mt-1">
                    {referral.reward}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("max-w-6xl mx-auto", className)} {...props}>
      <LoadingOverlay isLoading={loading} message="Loading your portal...">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Customer Portal
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage your services, view photos, and track your rewards
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history">Service History</TabsTrigger>
              <TabsTrigger value="photos">Photo Gallery</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="mt-6">
              {loading ? <ListLoading items={3} /> : renderServiceHistory()}
            </TabsContent>
            
            <TabsContent value="photos" className="mt-6">
              {loading ? <ListLoading items={6} /> : renderPhotoGallery()}
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              {loading ? <ListLoading items={3} /> : renderReviews()}
            </TabsContent>
            
            <TabsContent value="referrals" className="mt-6">
              {loading ? <ListLoading items={3} /> : renderReferrals()}
            </TabsContent>
          </Tabs>
        </div>

        {/* Photo Upload Modal */}
        <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
              <DialogDescription>
                Share photos from your service
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photo">Select Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handlePhotoUpload(file);
                  }}
                />
              </div>
              {uploadingPhoto && (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Uploading photo...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Modal */}
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Service</DialogTitle>
              <DialogDescription>
                Share your experience with {selectedService?.employee}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedService(prev => ({ ...prev, rating }))}
                    >
                      <Star
                        className={cn(
                          "w-6 h-6",
                          rating <= (selectedService?.rating || 0) 
                            ? "text-yellow-400 fill-current" 
                            : "text-neutral-300"
                        )}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                  id="review"
                  placeholder="Share your experience..."
                  rows={4}
                  onChange={(e) => setSelectedService(prev => ({ ...prev, review: e.target.value }))}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleReviewSubmit({
                  rating: selectedService?.rating || 5,
                  comment: selectedService?.review || ''
                })}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Submitting Review...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </LoadingOverlay>
    </div>
  );
};

export default CustomerPortal; 