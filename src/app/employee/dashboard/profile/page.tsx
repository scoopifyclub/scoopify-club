'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Calendar, Camera, Pencil, Save, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  bio: string;
  role: string;
  avatar: string;
  servicesCompleted: number;
  areasCovered: string[];
  cashAppUsername: string;
  stripeAccountId: string;
  hasStripeConnected: boolean;
  preferredPaymentMethod: 'CASH_APP' | 'STRIPE' | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    joinDate: '',
    bio: '',
    role: '',
    avatar: '',
    servicesCompleted: 0,
    areasCovered: [],
    cashAppUsername: '',
    stripeAccountId: '',
    hasStripeConnected: false,
    preferredPaymentMethod: null
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/employee/dashboard');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    // Check for query parameters (for Stripe Connect redirect)
    const checkQueryParams = () => {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const refresh = params.get('refresh');
      
      // Clean up URL
      if (success || refresh) {
        window.history.replaceState({}, document.title, '/employee/dashboard/profile');
      }
      
      if (success === 'true') {
        alert('Stripe account successfully connected!');
      }
      
      if (refresh === 'true') {
        alert('Please complete your Stripe onboarding');
      }
    };

    // Fetch profile data
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        const email = session?.user?.email;
        
        // Make API request to get profile data
        const response = await fetch(`/api/employee/profile?email=${encodeURIComponent(email!)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        
        // Set profile data from API response
        setProfileData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          joinDate: data.createdAt || '',
          bio: data.bio || '',
          role: session?.user?.role || 'EMPLOYEE',
          avatar: session?.user?.image || 'https://ui-avatars.com/api/?name=Employee+Name',
          servicesCompleted: data.completedJobs || 0,
          areasCovered: data.serviceAreas?.map((area: any) => area.zipCode) || [],
          cashAppUsername: data.cashAppUsername || '',
          stripeAccountId: data.stripeAccountId || '',
          hasStripeConnected: !!data.stripeAccountId,
          preferredPaymentMethod: data.preferredPaymentMethod || null
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        
        // Fallback to mock data
        const mockProfile: ProfileData = {
          name: session?.user?.name || 'Employee Name',
          email: session?.user?.email || 'employee@example.com',
          phone: '(555) 123-4567',
          address: '123 Main St, Anytown, USA',
          joinDate: '2023-01-15',
          bio: 'Experienced yard cleanup professional with 5+ years in the industry. Specialized in eco-friendly waste removal techniques.',
          role: 'EMPLOYEE',
          avatar: session?.user?.image || 'https://ui-avatars.com/api/?name=Employee+Name',
          servicesCompleted: 137,
          areasCovered: ['North Side', 'Downtown', 'Westpark', 'Riverside'],
          cashAppUsername: '',
          stripeAccountId: '',
          hasStripeConnected: false,
          preferredPaymentMethod: null
        };
        
        setProfileData(mockProfile);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchProfileData();
      checkQueryParams();
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Show loading state
      setIsLoading(true);
      
      // Send the updated profile data to the API
      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.email,
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
          cashAppUsername: profileData.cashAppUsername,
          preferredPaymentMethod: profileData.preferredPaymentMethod
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update was successful
      setIsEditing(false);
      // Show success toast or notification here
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error toast or notification here
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-gray-500">
            View and manage your profile information
          </p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Header */}
        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                  <img src={profileData.avatar} alt={profileData.name} className="aspect-square object-cover" />
                </Avatar>
                {isEditing && (
                  <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full shadow-sm bg-white">
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="space-y-1">
                  {isEditing ? (
                    <Input 
                      name="name" 
                      value={profileData.name} 
                      onChange={handleInputChange} 
                      className="text-xl font-bold"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {profileData.role}
                    </Badge>
                    <Badge variant="outline">
                      {`${profileData.servicesCompleted} Services Completed`}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-500">
                  {isEditing ? (
                    <textarea 
                      name="bio" 
                      value={profileData.bio} 
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                    />
                  ) : (
                    profileData.bio
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Your personal contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Address
              </div>
              {isEditing ? (
                <Input 
                  name="email" 
                  value={profileData.email} 
                  onChange={handleInputChange} 
                />
              ) : (
                <div>{profileData.email}</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number
              </div>
              {isEditing ? (
                <Input 
                  name="phone" 
                  value={profileData.phone} 
                  onChange={handleInputChange} 
                />
              ) : (
                <div>{profileData.phone}</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Address
              </div>
              {isEditing ? (
                <Input 
                  name="address" 
                  value={profileData.address} 
                  onChange={handleInputChange} 
                />
              ) : (
                <div>{profileData.address}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
            <CardDescription>Your role and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Employee Role
              </div>
              <div className="font-medium">{profileData.role}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Join Date
              </div>
              <div>{new Date(profileData.joinDate).toLocaleDateString()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Services Completed</div>
              <div className="font-medium">{profileData.servicesCompleted}</div>
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Service Areas</CardTitle>
            <CardDescription>Areas that you currently cover</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profileData.areasCovered.map((area, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Information
            </CardTitle>
            <CardDescription>
              How you'll receive payments for completed services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500 flex items-center">
                Cash App Username <span className="text-red-500 ml-1">*</span>
              </div>
              {isEditing ? (
                <Input 
                  name="cashAppUsername" 
                  value={profileData.cashAppUsername} 
                  onChange={handleInputChange}
                  placeholder="$YourCashAppUsername" 
                />
              ) : (
                <div>{profileData.cashAppUsername || 'Not set'}</div>
              )}
              <p className="text-xs text-gray-500">Required for receiving payments</p>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="text-sm text-gray-500">Stripe Direct Deposit (Optional)</div>
              {profileData.hasStripeConnected ? (
                <div className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Connected to Stripe
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Connect your bank account to receive payments directly via Stripe.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                    onClick={async () => {
                      try {
                        // Open Stripe Connect onboarding
                        const response = await fetch('/api/employee/stripe-connect', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to initiate Stripe Connect');
                        }
                        
                        const data = await response.json();
                        
                        // Redirect to Stripe Connect onboarding
                        window.location.href = data.url;
                      } catch (error) {
                        console.error('Error connecting to Stripe:', error);
                        alert('Failed to connect with Stripe. Please try again.');
                      }
                    }}
                  >
                    Connect with Stripe
                  </Button>
                </div>
              )}
            </div>
            
            {(profileData.cashAppUsername || profileData.hasStripeConnected) && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <label className="text-sm font-medium text-gray-700">
                  Preferred Payment Method <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded border ${
                        profileData.preferredPaymentMethod === 'CASH_APP'
                          ? 'bg-green-50 border-green-600 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      onClick={() => {
                        if (profileData.cashAppUsername) {
                          setProfileData({
                            ...profileData,
                            preferredPaymentMethod: 'CASH_APP'
                          });
                        } else {
                          alert('Please add your Cash App username first');
                        }
                      }}
                      disabled={!profileData.cashAppUsername}
                    >
                      Cash App
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded border ${
                        profileData.preferredPaymentMethod === 'STRIPE'
                          ? 'bg-purple-50 border-purple-600 text-purple-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      onClick={() => {
                        if (profileData.hasStripeConnected) {
                          setProfileData({
                            ...profileData,
                            preferredPaymentMethod: 'STRIPE'
                          });
                        } else {
                          alert('Please connect your Stripe account first');
                        }
                      }}
                      disabled={!profileData.hasStripeConnected}
                    >
                      Stripe Direct Deposit
                    </button>
                  </div>
                ) : (
                  <div className="text-sm">
                    {profileData.preferredPaymentMethod === 'CASH_APP' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Cash App
                      </span>
                    ) : profileData.preferredPaymentMethod === 'STRIPE' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Stripe Direct Deposit
                      </span>
                    ) : (
                      <span className="text-amber-600">No preference selected</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Please select your preferred payment method to avoid receiving payments through multiple methods
                </p>
              </div>
            )}
            
            {!profileData.cashAppUsername && !profileData.hasStripeConnected && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Please add your Cash App username or connect with Stripe to receive payments
              </div>
            )}
            
            {(profileData.cashAppUsername || profileData.hasStripeConnected) && !profileData.preferredPaymentMethod && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Please select your preferred payment method to ensure payments are sent correctly
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 