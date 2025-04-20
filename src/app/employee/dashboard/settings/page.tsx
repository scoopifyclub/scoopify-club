'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Lock, Moon, Eye, EyeOff, Save, Smartphone, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SettingsData {
  email_notifications: boolean;
  sms_notifications: boolean;
  app_notifications: boolean;
  dark_mode: boolean;
  language: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settings, setSettings] = useState<SettingsData>({
    email_notifications: true,
    sms_notifications: false,
    app_notifications: true,
    dark_mode: false,
    language: 'english'
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/employee/dashboard');
      return;
    }
    
    // Verify user is an employee
    if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
      router.push('/');
      return;
    }

    // Fetch settings data
    const fetchSettings = async () => {
      try {
        // In a real app, you would fetch this data from your API
        // For now, using mock data
        const mockSettings: SettingsData = {
          email_notifications: true,
          sms_notifications: false,
          app_notifications: true,
          dark_mode: false,
          language: 'english'
        };
        
        setSettings(mockSettings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'EMPLOYEE') {
      fetchSettings();
    }
  }, [status, session, router]);

  const handleToggleSetting = (setting: keyof SettingsData) => {
    if (typeof settings[setting] === 'boolean') {
      setSettings({
        ...settings,
        [setting]: !settings[setting]
      });
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      language: e.target.value
    });
  };

  const handleSaveSettings = () => {
    // In a real app, you would save these settings to your API
    console.log('Saving settings:', settings);
    // Show success message
    alert('Settings saved successfully');
  };

  const handleChangePassword = () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    // In a real app, you would send this to your API
    console.log('Changing password');
    
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    // Show success message
    alert('Password changed successfully');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] transition-opacity duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-gray-500">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email_notifications" 
                checked={settings.email_notifications}
                onCheckedChange={() => handleToggleSetting('email_notifications')}
              />
              <Label htmlFor="email_notifications">Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sms_notifications" 
                checked={settings.sms_notifications}
                onCheckedChange={() => handleToggleSetting('sms_notifications')}
              />
              <Label htmlFor="sms_notifications">SMS Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="app_notifications" 
                checked={settings.app_notifications}
                onCheckedChange={() => handleToggleSetting('app_notifications')}
              />
              <Label htmlFor="app_notifications">In-App Notifications</Label>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              App Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dark_mode" 
                checked={settings.dark_mode}
                onCheckedChange={() => handleToggleSetting('dark_mode')}
              />
              <Label htmlFor="dark_mode" className="flex items-center">
                <Moon className="h-4 w-4 mr-2" />
                Dark Mode
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Language
              </Label>
              <select
                id="language"
                value={settings.language}
                onChange={handleLanguageChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
              </select>
            </div>
            
            <Button onClick={handleSaveSettings} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleChangePassword}>
                  Update Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 