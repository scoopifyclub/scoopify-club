'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Simple local settings for demo; can be extended to persist to backend
const DEFAULT_SETTINGS = {
  onboarding: true,
  job: true,
  payment: true,
  sound: false
};

export function NotificationSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Settings updated');
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Onboarding Reminders</span>
            <Switch checked={settings.onboarding} onCheckedChange={() => handleToggle('onboarding')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Job Notifications</span>
            <Switch checked={settings.job} onCheckedChange={() => handleToggle('job')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Payment Updates</span>
            <Switch checked={settings.payment} onCheckedChange={() => handleToggle('payment')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Sound</span>
            <Switch checked={settings.sound} onCheckedChange={() => handleToggle('sound')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
