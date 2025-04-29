'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true,
        darkMode: false,
        autoAcceptJobs: false,
        showEarnings: true
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSettingChange = (setting) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/employee/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Settings</h1>
                <Button onClick={saveSettings} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Notifications</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <Switch
                            id="emailNotifications"
                            checked={settings.emailNotifications}
                            onCheckedChange={() => handleSettingChange('emailNotifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <Switch
                            id="pushNotifications"
                            checked={settings.pushNotifications}
                            onCheckedChange={() => handleSettingChange('pushNotifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <Switch
                            id="smsNotifications"
                            checked={settings.smsNotifications}
                            onCheckedChange={() => handleSettingChange('smsNotifications')}
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Preferences</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="darkMode">Dark Mode</Label>
                        <Switch
                            id="darkMode"
                            checked={settings.darkMode}
                            onCheckedChange={() => handleSettingChange('darkMode')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="autoAcceptJobs">Auto-accept Jobs</Label>
                        <Switch
                            id="autoAcceptJobs"
                            checked={settings.autoAcceptJobs}
                            onCheckedChange={() => handleSettingChange('autoAcceptJobs')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="showEarnings">Show Earnings</Label>
                        <Switch
                            id="showEarnings"
                            checked={settings.showEarnings}
                            onCheckedChange={() => handleSettingChange('showEarnings')}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
