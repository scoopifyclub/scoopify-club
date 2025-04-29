'use client';

import React from 'react';

export default function AdminSettings() {
    const [settings, setSettings] = React.useState({
        emailNotifications: true,
        autoAssignEmployees: false,
        requirePaymentUpfront: true,
        allowCustomerRescheduling: true,
    });

    const handleSettingChange = (setting) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            // Show success message
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-lg">Email Notifications</label>
                    <button
                        onClick={() => handleSettingChange('emailNotifications')}
                        className={`px-4 py-2 rounded ${
                            settings.emailNotifications
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200'
                        }`}
                    >
                        {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-lg">Auto-assign Employees</label>
                    <button
                        onClick={() => handleSettingChange('autoAssignEmployees')}
                        className={`px-4 py-2 rounded ${
                            settings.autoAssignEmployees
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200'
                        }`}
                    >
                        {settings.autoAssignEmployees ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-lg">Require Payment Upfront</label>
                    <button
                        onClick={() => handleSettingChange('requirePaymentUpfront')}
                        className={`px-4 py-2 rounded ${
                            settings.requirePaymentUpfront
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200'
                        }`}
                    >
                        {settings.requirePaymentUpfront ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-lg">Allow Customer Rescheduling</label>
                    <button
                        onClick={() => handleSettingChange('allowCustomerRescheduling')}
                        className={`px-4 py-2 rounded ${
                            settings.allowCustomerRescheduling
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200'
                        }`}
                    >
                        {settings.allowCustomerRescheduling ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
} 