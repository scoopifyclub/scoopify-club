'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Save, Upload } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  bio: z.string().max(500, { message: 'Bio must not exceed 500 characters' }).optional(),
  experienceYears: z.coerce.number().min(0, { message: 'Experience must be a positive number' }),
  specialties: z.string().optional(),
  certifications: z.string().optional(),
  paymentInfo: z.string().optional(),
  availabilityHours: z.string().optional(),
  preferredServiceAreas: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EmployeeProfilePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      experienceYears: 0,
      specialties: '',
      certifications: '',
      paymentInfo: '',
      availabilityHours: '',
      preferredServiceAreas: '',
    },
  });
  
  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch(`/api/employee/profile?email=${session.user.email}`);
          if (response.ok) {
            const data = await response.json();
            setEmployeeData(data);
            
            // Set form values
            form.reset({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              bio: data.bio || '',
              experienceYears: data.experienceYears || 0,
              specialties: data.specialties || '',
              certifications: data.certifications || '',
              paymentInfo: data.paymentInfo || '',
              availabilityHours: data.availabilityHours || '',
              preferredServiceAreas: data.preferredServiceAreas || '',
            });
          } else {
            toast({
              title: "Error fetching profile",
              description: "Could not load your profile information.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          toast({
            title: "Error fetching profile",
            description: "Could not load your profile information.",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchEmployeeData();
  }, [session, status, form, toast]);
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        
        // Refresh employee data
        const updatedEmployee = await response.json();
        setEmployeeData(updatedEmployee);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error updating profile",
          description: errorData.message || "Could not update your profile.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (status === 'loading' || !employeeData) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-gray-500">
          Manage your personal information and service preferences.
        </p>
      </div>
      
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-green-500">
          {employeeData.image ? (
            <Image
              src={employeeData.image}
              alt={employeeData.name || 'Profile picture'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-700">
                {employeeData.name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
        
        <div>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload Photo</span>
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            JPG, GIF or PNG. 1MB max.
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="experienceYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell customers about yourself and your experience..."
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Brief description that will be shown on your public profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialties</FormLabel>
                  <FormControl>
                    <Input placeholder="Commercial properties, Pool cleaning, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate multiple specialties with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <FormControl>
                    <Input placeholder="Certified Pool Operator, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate multiple certifications with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Information</FormLabel>
                  <FormControl>
                    <Input placeholder="Payment details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="preferredServiceAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Service Areas</FormLabel>
                  <FormControl>
                    <Input placeholder="Downtown, North Side, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate multiple areas with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="availabilityHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability Hours</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Monday: 9am-5pm, Tuesday: 9am-5pm, etc."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Specify your typical available hours for each day of the week
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
} 