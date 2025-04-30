'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AdminSettings from '@/components/admin/AdminSettings';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function AdminSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/signin');
            return;
        }

        if (user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/admin/settings');
                if (!response.ok) {
                    throw new Error('Failed to fetch settings');
                }
                const data = await response.json();
                setSettings(data);
            } catch (error) {
                toast.error('Error loading settings');
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchSettings();
        }
    }, [user, authLoading, router]);

    if (loading || authLoading) {
        return <LoadingSpinner />;
    }

    if (!settings) {
        return <div>Failed to load settings</div>;
    }

    return <AdminSettings settings={settings} />;
}
