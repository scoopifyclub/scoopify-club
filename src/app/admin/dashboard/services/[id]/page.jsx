'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, User, Phone, Mail, ClipboardEdit, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ServiceDetails } from '@/components/admin/ServiceDetails';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function AdminServicePage({ params }) {
    const { id } = params;
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/signin');
            return;
        }

        if (user?.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        const fetchService = async () => {
            try {
                const response = await fetch(`/api/services/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch service');
                }
                const data = await response.json();
                setService(data);
            } catch (error) {
                toast.error('Error loading service details');
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchService();
        }
    }, [id, user, authLoading, router]);

    if (loading || authLoading) {
        return <LoadingSpinner />;
    }

    if (!service) {
        return <div>Service not found</div>;
    }

    return <ServiceDetails service={service} />;
}
