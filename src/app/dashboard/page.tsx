'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Settings, History, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome back, {session.user?.name}</h1>
          <Button asChild>
            <Link href="/dashboard/schedule">Schedule Service</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Service</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Tomorrow</div>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline-block h-3 w-3 mr-1" />
                9:00 AM - 11:00 AM
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <MapPin className="inline-block h-3 w-3 mr-1" />
                123 Main St, Anytown
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Service</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1 week ago</div>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline-block h-3 w-3 mr-1" />
                9:00 AM - 11:00 AM
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <MapPin className="inline-block h-3 w-3 mr-1" />
                123 Main St, Anytown
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billing</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$29.99</div>
              <p className="text-xs text-muted-foreground">
                Next payment due in 2 weeks
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/dashboard/billing">View Billing History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-24" asChild>
                <Link href="/dashboard/schedule">
                  <Calendar className="h-6 w-6 mr-2" />
                  Schedule Service
                </Link>
              </Button>
              <Button variant="outline" className="h-24" asChild>
                <Link href="/dashboard/history">
                  <History className="h-6 w-6 mr-2" />
                  View History
                </Link>
              </Button>
              <Button variant="outline" className="h-24" asChild>
                <Link href="/dashboard/billing">
                  <CreditCard className="h-6 w-6 mr-2" />
                  Manage Billing
                </Link>
              </Button>
              <Button variant="outline" className="h-24" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-6 w-6 mr-2" />
                  Account Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 